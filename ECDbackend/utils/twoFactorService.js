const axios = require('axios');

/**
 * Send real-time SMS OTP using 2Factor.in API gateway
 * @param {string} mobile - 10-digit mobile number or with +91 country code
 * @param {string} otp - 4 to 6 digit OTP string
 * @returns {Promise<object>}
 */
const send2FactorOTP = async (mobile, otp) => {
  const apiKey = process.env.TWO_FACTOR_API_KEY || '02532f33-4cfd-11f1-9800-0200cd936042';
  
  if (!mobile || !otp) {
    throw new Error('Mobile number and OTP are required');
  }

  // Clean mobile: strip any non-digits
  const cleanDigits = mobile.replace(/\D/g, '');
  // Extract 10-digit Indian phone number
  const phone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

  const templateName = process.env.TWO_FACTOR_TEMPLATE_NAME || 'ECDKARTOTP';

  console.log(`📱 [2Factor SMS] Sending SMS OTP ${otp} to +91${phone} via template ${templateName}...`);

  try {
    // 2Factor.in DLT Approved SMS Template Endpoint (Delivers genuine text SMS under ECDKRT)
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/${templateName}`;
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ [2Factor SMS] Dispatched to +91${phone} (${templateName}):`, response.data);
    return {
      success: true,
      data: response.data,
      sessionId: response.data?.Details
    };
  } catch (error) {
    console.error(`⚠️ [2Factor SMS] Template ${templateName} dispatch error:`, error.response?.data || error.message);
    try {
      const fallbackUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}`;
      const fallbackRes = await axios.get(fallbackUrl, { timeout: 10000 });
      console.log(`✅ [2Factor SMS] Fallback response:`, fallbackRes.data);
      return {
        success: true,
        data: fallbackRes.data,
        sessionId: fallbackRes.data?.Details
      };
    } catch (fallbackErr) {
      console.error(`❌ [2Factor SMS] Failed to send SMS via 2Factor:`, fallbackErr.response?.data || fallbackErr.message);
      return {
        success: false,
        error: fallbackErr.response?.data?.Details || fallbackErr.message
      };
    }
  }
};

module.exports = {
  send2FactorOTP
};
