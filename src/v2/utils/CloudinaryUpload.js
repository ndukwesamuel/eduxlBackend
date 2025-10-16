import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dkzds0azx",
  api_key: "617445194715168",
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk",
});

const uploadToCloudinary = async (file, options = {}) => {
  try {
    const uploadOptions = {
      resource_type: "auto",
      folder: "general_uploads",
      ...options, // Override defaults with provided options
    };

    // If file is a path (tempFilePath) or a base64 string or a buffer
    const uploadSource =
      file.tempFilePath || file.path || file.buffer || file.base64;

    if (!uploadSource) {
      throw new Error("No valid file source provided for upload");
    }

    const result = await cloudinary.uploader.upload(
      uploadSource,
      uploadOptions
    );
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {Object} options - Delete options
 * @param {string} options.resource_type - Resource type (default: 'image')
 * @returns {Promise<Object>} - Cloudinary delete response
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const deleteOptions = {
      resource_type: "image",
      ...options,
    };

    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    return {
      success: result.result === "ok",
      result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
