import axios from "axios";
// const EXTERNAL_BASE_URL = "https://payment-pro-api.blusalt.net"; // "https://mock-external-payment-api.com";
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;
const EXTERNAL_BASE_URL = process.env.EXTERNAL_BASE_URL;
//   "test_c68fb317ca44fc14f37a195cec87dd2283b416de6d680a9ab929bbc05bc127336472b4de1da81f21c8b1fdb9c312b78a1759560887743sk"; //"YOUR_SECURE_EXTERNAL_API_KEY";
export const createVirtualAccount = async (accountData) => {
  try {
    console.log(
      `[Service] Sending request to: ${EXTERNAL_BASE_URL}/api/v1/virtual-account`
    );

    const response = await axios({
      method: "get",
      url: `${EXTERNAL_BASE_URL}/api/v1/virtual-account`,
      headers: {
        // The API key is handled here in the service layer,
        // keeping it out of the controller and request headers.
        "x-api-key": EXTERNAL_API_KEY,
        "Content-Type": "application/json",
      },
      //   data: accountData,
    });

    // The service returns the data for the controller to handle.
    return response.data;
  } catch (error) {
    // Re-throw standardized error or enrich it for the controller
    if (error.response) {
      // Error received from external API (4xx, 5xx)
      const apiError = new Error("External API call failed");
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      throw apiError;
    } else {
      // Network or internal Axios error
      throw new Error(`Network or service unavailable: ${error.message}`);
    }
  }
};
