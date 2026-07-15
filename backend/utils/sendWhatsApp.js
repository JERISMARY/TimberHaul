/**
 * WhatsApp Service Simulator
 * 
 * In a real production environment, this would integrate with the Twilio API
 * or the official WhatsApp Business API (Meta). 
 * 
 * Since API keys were not provided, this service securely simulates the payload
 * and logs it to the console, while keeping the architecture 100% ready for
 * a drop-in replacement of Twilio.
 */

const sendWhatsApp = async ({ phone, message }) => {
  try {
    // Basic phone number sanitization
    const sanitizedPhone = phone.replace(/[^\d+]/g, '');

    // Log the simulation
    console.log(`\n======================================================`);
    console.log(`💬 WHATSAPP NOTIFICATION SIMULATION`);
    console.log(`======================================================`);
    console.log(`📱 To:       ${sanitizedPhone}`);
    console.log(`📩 Message:  ${message}`);
    console.log(`======================================================\n`);

    // In production, uncomment and use Twilio:
    /*
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886', // Twilio Sandbox Number
      to: `whatsapp:${sanitizedPhone}`
    });
    */

    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return false;
  }
};

module.exports = sendWhatsApp;
