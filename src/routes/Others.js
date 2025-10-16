import express from "express";

import googlePlayScraper from "google-play-scraper"; // Replace require with import
import appStoreScraper from "app-store-scraper";

const router = express.Router();

router.route("/share-link-to-app").get((req, res) => {
  const link = `www.Pausepoint.net`;
  res.json({ link });
});

router.route("/latest-version/android").get(async (req, res) => {
  const packageName = "com.pause_point.PausePoint"; // Removed extra space before `com`
  const result = await googlePlayScraper.app({ appId: packageName }); // Updated to match library API
  const latestVersion = result.version;
  res.json({ latestVersion });
});

// router.route("/latest-version/ios").get(async (req, res) => {
//   const appId = "6739864683"; // Replace with the correct app ID
//   try {
//     const result = await appStoreScraper.app({ id: appId });
//     res.json({ result });
//   } catch (error) {
//     console.error("Error fetching app details:", error.message);
//     res.status(404).json({ error: "App not found or invalid app ID" });
//   }
// });
// router.route("/latest-version/ios").get(async (req, res) => {
//   try {
//     const appName = "pausepoint";
//     console.log("Searching for app:", appName);
//     const results = await appStoreScraper.search({
//       term: appName,
//       // num: 1, // Get the top result
//     });

//     res.json({ result: results });
//     // if (results.length > 0) {
//     //   const appDetails = results[0];
//     //   res.json({ result: appDetails });
//     // } else {
//     //   res.status(404).json({ error: "App not found in search results" });
//     // }
//   } catch (error) {
//     console.error("Error searching for app details:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/latest-version/ios").get(async (req, res) => {
  const appId = "6739864683"; // Corrected App ID
  const countryCode = "NG"; // Use the correct country code, e.g., 'US' for the US, 'NG' for Nigeria

  try {
    console.log("Fetching app details for ID:", appId);

    // Specify the country parameter in the search query
    const result = await appStoreScraper.app({
      id: appId,
      country: countryCode,
    });

    const latestVersion = result.version; // Get the latest version from App Store
    res.json({ latestVersion });
  } catch (error) {
    console.error("Error fetching app details:", error.message);
    res.status(404).json({ error: "App not found or invalid app ID" });
  }
});

export default router;
