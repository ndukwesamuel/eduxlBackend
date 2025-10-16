import axios from "axios";

/**
 * Sends a code to the GPass API
 * @param {string} estateId - The estate ID (e.g., 'LAG-HLE-45BX')
 * @param {string} code - The code to send (e.g., '123456')
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendGPassCode(estateId, code) {
  const apiKey = "ZZXDW25eJKMLXm2N"; // Consider using environment variables
  const baseUrl =
    "https://agspass.codemambasolutions.com/api/main.asmx/SENDCode";

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      EstateID: estateId,
      GCode: code,
    });

    const response = await axios.get(`${baseUrl}?${params.toString()}`);

    console.log({
      ghg: response?.data,
    });

    // Simple XML check (no need for full parser in this case)
    if (response.data.includes('<string xmlns="GPass">SUCCESS</string>')) {
      return { success: true, message: "Code sent successfully" };
    }

    return { success: false, message: "API returned unexpected response" };
  } catch (error) {
    console.error("GPass API Error:", error.message);
    return {
      success: false,
      message: error.response?.data || error.message,
    };
  }
}

export { sendGPassCode };
