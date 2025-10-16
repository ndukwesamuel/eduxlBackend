// cloudinaryConfig.js
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Add console logs to help debug the configuration
console.log("Cloudinary Configuration:");
console.log(
  "CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set"
);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "Set" : "Not set");
console.log(
  "API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set"
);

cloudinary.config({
  cloud_name: "dkzds0azx", // process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "617445194715168", //process.env.CLOUDINARY_API_KEY,
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk", // process.env.CLOUDINARY_API_SECRET,
});

// Verify the configuration worked
console.log("Cloudinary configured:", !!cloudinary.config().cloud_name);

export { cloudinary };
