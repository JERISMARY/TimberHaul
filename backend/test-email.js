require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

(async () => {
  console.log('Testing SMTP connection...');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  
  try {
    const result = await sendEmail({
      email: process.env.EMAIL_USER, // Send it to yourself
      subject: 'SMTP Test - TimberHaul',
      html: '<h1>SMTP is working!</h1><p>If you received this, your email configuration in .env is correct.</p>'
    });
    
    if (result) {
      console.log('✅ Test email sent successfully! Check your inbox.');
    } else {
      console.log('❌ Failed to send test email. Check your SMTP credentials (especially the app password).');
    }
  } catch (error) {
    console.error('❌ Error caught in test script:', error);
  }
  process.exit();
})();
