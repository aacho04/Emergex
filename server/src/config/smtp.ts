import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'noreply@emergex.com',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationOTP = async (email: string, otp: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Emergex</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Verify Your Email</h2>
        <p>Thank you for registering your hospital with Emergex. Use the OTP below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #1e40af; color: white; padding: 16px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  await sendEmail(email, 'Your Verification OTP - Emergex', html);
};

export default getTransporter;
