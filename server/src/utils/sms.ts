/**
 * SMS utility for sending location request links to callers.
 * Replace the sendSMS function body with your SMS provider (Twilio, MSG91, etc.)
 */

export const sendSMS = async (phone: string, message: string): Promise<void> => {
  // TODO: Integrate with an SMS provider (e.g., Twilio)
  // Example with Twilio:
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });

  console.log(`[SMS] To: ${phone}`);
  console.log(`[SMS] Message: ${message}`);
};

export const sendLocationRequestSMS = async (phone: string, locationUrl: string): Promise<void> => {
  const message = `EMERGEX Emergency Alert: Your location is needed for ambulance dispatch. Please click this link and allow location access: ${locationUrl}`;
  await sendSMS(phone, message);
};
