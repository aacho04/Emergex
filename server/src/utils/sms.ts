/**
 * SMS utility using Twilio.
 * Docs: https://www.twilio.com/docs/sms/quickstart/node
 */
import twilio from 'twilio';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '';

export const sendSMS = async (phone: string, message: string): Promise<void> => {
  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    console.warn('[SMS] Twilio credentials not set - logging instead of sending');
    console.log(`[SMS] To: ${phone}`);
    console.log(`[SMS] Message: ${message}`);
    return;
  }

  try {
    console.log(`[SMS] Sending to: ${phone}`);
    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: phone,
    });

    console.log(`[SMS] Sent successfully - SID: ${result.sid}, Status: ${result.status}`);
  } catch (error: any) {
    console.error('[SMS] Twilio error:', error.message);
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

export const sendLocationRequestSMS = async (phone: string, locationUrl: string): Promise<void> => {
  const message = `EMERGEX Emergency Alert: Your location is needed for ambulance dispatch. Please click this link and allow location access: ${locationUrl}`;
  await sendSMS(phone, message);
};
