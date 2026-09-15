const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const sendOTP = async (mobile, otp) => {
  const message = await client.messages.create({
    body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobile,
  });
  return message;
};
module.exports = { sendOTP };
