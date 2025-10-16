import { cloudinary } from "../helpers/cloudinaryConfig";

export const uploadToCloudinary = async (tempFilePath) => {
  try {
    const { secure_url } = await cloudinary.v2.uploader.upload(tempFilePath, {
      use_filename: true,
      folder: "marketplace",
    });
    return secure_url;
  } catch (error) {
    throw new ApiError.internalServerError(
      500,
      "Error uploading to Cloudinary: " + error.message
    );
  }
};
