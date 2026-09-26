const { send2FactorOTP } = require("./twoFactorService");

let client = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require("twilio");
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
} catch (e) {}

const sendOTP = async (mobile, otp) => {
  try {
    // Primary: 2Factor.in Indian Transactional SMS Gateway
    const twoFactorRes = await send2FactorOTP(mobile, otp);
    if (twoFactorRes.success) {
      return twoFactorRes;
    }
  } catch (err) {
    console.error("2Factor dispatch error in sendOTP:", err.message);
  }

  // Fallback: Twilio
  if (client && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const message = await client.messages.create({
        body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mobile,
      });
      return message;
    } catch (twErr) {
      console.error("Twilio fallback failed:", twErr.message);
    }
  }
  return { success: false, message: "SMS provider unavailable" };
};

module.exports = { sendOTP };
