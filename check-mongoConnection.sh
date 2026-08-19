#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

# 1. Verify .env exists
if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the root directory."
  exit 1
fi

# 2. Safely load .env variables
set -a
. ./.env
set +a

# 3. Determine target environment and URI
TARGET_ENV="${RUN_ENV:-test}"
UPPER_ENV="$(echo "$TARGET_ENV" | tr '[:lower:]' '[:upper:]')"
URI_VAR="MONGODB_URI_${UPPER_ENV}"

eval "SPECIFIC_URI=\"\${$URI_VAR:-}\""
export MONGO_URI="${SPECIFIC_URI:-${MONGODB_URI:-}}"

if [ -z "$MONGO_URI" ]; then
  echo "Error: Could not resolve a MongoDB URI."
  echo "Ensure $URI_VAR or MONGODB_URI is set in your .env file."
  exit 1
fi

MASKED_URI="$(echo "$MONGO_URI" | sed -E 's/(:[^:@]+@)/:****@/')"

echo "────────────────────────────────────────"
echo " Environment: $TARGET_ENV"
echo " Testing URI: $MASKED_URI"
echo "────────────────────────────────────────"

# 4. Set up an isolated temporary directory for the download
TEMP_DIR="$(mktemp -d)"

# Ensure the temporary directory is deleted when the script exits
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Downloading 'mongodb' Node package..."
cd "$TEMP_DIR"
npm install mongodb --no-save --silent

# 5. Test connection using MongoDB Atlas recommended configuration
echo "Connecting to database..."
node --no-warnings -e "
const { MongoClient, ServerApiVersion } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.dir(error);
    process.exit(1);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run();
"