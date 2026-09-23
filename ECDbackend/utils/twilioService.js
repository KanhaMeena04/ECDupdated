const axios = require("axios");

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.log("Twilio initialization error:", err.message);
  }
}

/**
 * Send pure SMS OTP using approved DLT Template ECDKARTOTP (Sender: ECDKRT)
 * @param {string} mobile - 10-digit mobile number
 * @param {string} [customOtp] - 6-digit dynamic OTP
 */
const sendOTP = async (mobile, customOtp) => {
  const cleanMobile = (mobile || "").toString().replace(/[^0-9]/g, '');
  const last10 = cleanMobile.slice(-10);
  const twoFactorKey = process.env.TWO_FACTOR_API_KEY || "02532f33-4cfd-11f1-9800-0200cd936042";

  console.log(`📱 [SMS Service] Dispatching pure Text SMS to +91${last10} via DLT Template ECDKARTOTP...`);

  // 1. Primary Gateway: 2Factor.in with Approved DLT Template 'ECDKARTOTP' and Sender ID 'ECDKRT'
  if (twoFactorKey) {
    try {
      const url = customOtp
        ? `https://2factor.in/API/V1/${twoFactorKey}/SMS/${last10}/${customOtp}/ECDKARTOTP`
        : `https://2factor.in/API/V1/${twoFactorKey}/SMS/${last10}/AUTOGEN/ECDKARTOTP`;

      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✅ [2Factor SMS Text] Live SMS successfully sent via ECDKRT header to +91${last10}:`, response.data);
      if (response.data && response.data.Status === "Success") {
        return {
          success: true,
          provider: "2factor",
          sessionId: response.data.Details,
          data: response.data
        };
      }
    } catch (twoFactorErr) {
      console.error(`❌ [2Factor SMS Error] for +91${last10}:`, twoFactorErr.response?.data || twoFactorErr.message);
    }
  }

  // 2. Fallback Gateway: Twilio SMS (if configured)
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER && customOtp) {
    try {
      const message = await twilioClient.messages.create({
        body: `Your ECD KART OTP is: ${customOtp}. Valid for 10 minutes. Do not share it with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${last10}`,
      });
      console.log(`✅ [Twilio SMS] Live SMS sent via Twilio to +91${last10}:`, message.sid);
      return { success: true, provider: "twilio", sid: message.sid };
    } catch (twilioErr) {
      console.error(`❌ [Twilio SMS Error] Failed to send to +91${last10}:`, twilioErr.message);
    }
  }

  return { success: false, message: "No SMS gateway succeeded" };
};

/**
 * Verify 2Factor SMS OTP
 * @param {string} sessionId - 2Factor session ID from sendOTP
 * @param {string} enteredOtp - User entered 6-digit OTP
 */
const verify2FactorOTP = async (sessionId, enteredOtp) => {
  const twoFactorKey = process.env.TWO_FACTOR_API_KEY || "02532f33-4cfd-11f1-9800-0200cd936042";
  if (!twoFactorKey || !sessionId || !enteredOtp) {
    return false;
  }

  try {
    const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/VERIFY/${sessionId}/${enteredOtp.trim()}`;
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`🔍 [2Factor Verify] Response for session ${sessionId}:`, response.data);
    if (response.data && response.data.Status === "Success" && response.data.Details === "OTP Matched") {
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ [2Factor Verify Error]:`, err.response?.data || err.message);
    return false;
  }
};

module.exports = { sendOTP, verify2FactorOTP };
