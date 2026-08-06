#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

NODE_MIN_VERSION="20.19.0"
NODE_BOOTSTRAP_VERSION="20.19.0"
NODE_PLATFORM="$(uname -s | tr '[:upper:]' '[:lower:]')"
NODE_ARCH="$(uname -m)"

case "$NODE_ARCH" in
  x86_64|amd64) NODE_ARCH="x64" ;;
  aarch64|arm64) NODE_ARCH="arm64" ;;
  *)
    echo "Unsupported CPU architecture: $NODE_ARCH"
    exit 1
    ;;
esac

case "$NODE_PLATFORM" in
  linux)
    NODE_PACKAGE="node-v${NODE_BOOTSTRAP_VERSION}-linux-${NODE_ARCH}.tar.xz"
    NODE_INSTALL_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/uaetrail-tools"
    ;;
  darwin)
    NODE_PACKAGE="node-v${NODE_BOOTSTRAP_VERSION}-darwin-${NODE_ARCH}.tar.gz"
    NODE_INSTALL_ROOT="${XDG_DATA_HOME:-$HOME/Library/Application Support}/uaetrail-tools"
    ;;
  *)
    echo "Unsupported OS for this launcher: $(uname -s)"
    exit 1
    ;;
esac

NODE_INSTALL_DIR="$NODE_INSTALL_ROOT/node-v${NODE_BOOTSTRAP_VERSION}-${NODE_PLATFORM}-${NODE_ARCH}"
NODE_BIN_DIR="$NODE_INSTALL_DIR/bin"
NODE_BIN="$NODE_BIN_DIR/node"

normalize_version() {
  _value="${1#v}"
  _value="${_value#V}"
  _value="${_value%%-*}"
  echo "$_value"
}

version_ge() {
  _left="$(normalize_version "$1")"
  _right="$(normalize_version "$2")"
  awk -v a="$_left" -v b="$_right" 'BEGIN {
    split(a, av, ".");
    split(b, bv, ".");
    for (i = 1; i <= 3; i++) {
      ai = (av[i] == "" ? 0 : av[i]) + 0;
      bi = (bv[i] == "" ? 0 : bv[i]) + 0;
      if (ai > bi) exit 0;
      if (ai < bi) exit 1;
    }
    exit 0;
  }'
}

ensure_node() {
  if command -v node >/dev/null 2>&1 ; then
    NODE_CURRENT_VERSION="$(node --version 2>/dev/null || true)"
    if version_ge "$NODE_CURRENT_VERSION" "$NODE_MIN_VERSION" ; then
      return 0
    fi
  fi

  if [ -x "$NODE_BIN" ] ; then
    NODE_CACHED_VERSION="$("$NODE_BIN" --version 2>/dev/null || true)"
    if version_ge "$NODE_CACHED_VERSION" "$NODE_MIN_VERSION" ; then
      PATH="$NODE_BIN_DIR:$PATH"
      export PATH
      return 0
    fi
  fi

  command -v curl >/dev/null 2>&1 || {
    echo "curl is required to download Node.js ${NODE_BOOTSTRAP_VERSION}. Install curl and rerun."
    exit 1
  }
  command -v tar >/dev/null 2>&1 || {
    echo "tar is required to extract Node.js ${NODE_BOOTSTRAP_VERSION}. Install tar and rerun."
    exit 1
  }

  mkdir -p "$NODE_INSTALL_ROOT"
  NODE_TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t uaetrail-node)"
  NODE_ARCHIVE="$NODE_TMP_DIR/$NODE_PACKAGE"
  NODE_URL="https://nodejs.org/dist/v${NODE_BOOTSTRAP_VERSION}/$NODE_PACKAGE"

  echo "Downloading Node.js ${NODE_BOOTSTRAP_VERSION}..."
  curl -fsSL "$NODE_URL" -o "$NODE_ARCHIVE"

  rm -rf "$NODE_INSTALL_DIR"
  tar -xf "$NODE_ARCHIVE" -C "$NODE_TMP_DIR"
  mv "$NODE_TMP_DIR/node-v${NODE_BOOTSTRAP_VERSION}-${NODE_PLATFORM}-${NODE_ARCH}" "$NODE_INSTALL_DIR"
  rm -rf "$NODE_TMP_DIR"

  PATH="$NODE_BIN_DIR:$PATH"
  export PATH
}

ensure_node

echo "[1/4] Checking prerequisites..."
NODE_ACTIVE_VERSION="$(node --version 2>/dev/null || true)"
if ! version_ge "$NODE_ACTIVE_VERSION" "$NODE_MIN_VERSION" ; then
  echo "Failed to activate Node.js ${NODE_MIN_VERSION} or newer (current: ${NODE_ACTIVE_VERSION:-none})."
  exit 1
fi

echo "[2/4] Verifying host versions and workspace dependencies..."
node scripts/run-project-preflight.mjs

echo "[3/4] Checking Docker engine status..."
docker info >/dev/null 2>&1 || true

echo "[4/4] Starting project stack..."
node scripts/run-project.mjs "$@"