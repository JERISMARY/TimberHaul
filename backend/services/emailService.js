const sendEmail = require('../utils/sendEmail');
const { getAdminNotificationTemplate, getUserThankYouTemplate } = require('../utils/emailTemplates');

/**
 * Sends notification email to admin and thank you email to user
 * @param {Object} messageData The saved message document
 */
const sendContactEmails = async (messageData) => {
  try {
    // 1. Send Admin Notification
    const adminEmail = process.env.EMAIL_USER;
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `New Contact/Feedback Submission`,
        html: getAdminNotificationTemplate(messageData)
      });
    }

    // 2. Send Thank You Email to User
    if (messageData.email) {
      await sendEmail({
        email: messageData.email,
        subject: 'Thank You for Contacting TimberHaul',
        html: getUserThankYouTemplate(messageData)
      });
    }
  } catch (error) {
    console.error('Error in sendContactEmails service:', error);
    // We catch the error so it doesn't crash the server or block the API response
  }
};

module.exports = {
  sendContactEmails
};
