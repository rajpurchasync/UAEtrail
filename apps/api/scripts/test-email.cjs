const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const user = process.env.SMTP_GMAIL_USER || 'uaetrail@gmail.com';
const pass = (process.env.SMTP_GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const to = process.argv[2] || 'rajdhakal31@gmail.com';

if (!pass) {
  console.error('SMTP_GMAIL_APP_PASSWORD is not set in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass
  }
});

const mailOptions = {
  from: user,
  to,
  subject: 'New Submission from Website',
  text: 'This is a test email sent from Node.js via Gmail.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});
