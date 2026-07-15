const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create a transporter using SMTP credentials from .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Define the email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TimberHaul" <digifarm2025@gmail.com>',
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent successfully to ${options.email} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${options.email}:`, error.message);
    // Don't throw error to prevent breaking the main flow (like registration/checkout) if email fails
    return null;
  }
};

module.exports = sendEmail;
