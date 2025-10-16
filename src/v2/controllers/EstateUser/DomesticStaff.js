import domesticstaff from "../../../models/domesticstaff.js";
import { uploadToCloudinary } from "../../utils/CloudinaryUpload.js";

export const createDomesticstaff = async (req, res) => {
  try {
    const user_id = req.user._id;
    const clan = req.clan;

    let vvv = req.files.images;
    console.log({
      nnnn: req,
    });

    const {
      staffName,
      gender,
      phone,
      dateOfBirth,
      homeAddress,
      Role,
      workingHours,
    } = req.body;

    const uploadResult = await uploadToCloudinary(vvv, {
      folder: "user_avatars",
      // transformation: { width: 300, height: 300, crop: 'fill' }
    });

    const newStaff = new domesticstaff({
      user: user_id,
      clan: clan._id,
      staffName,
      gender,
      phone,
      dateOfBirth,
      homeAddress,
      Role,
      workingHours,
      photo: uploadResult?.result?.secure_url,
    });

    const savedStaff = await newStaff.save();
    res.status(201).json({
      success: true,
      savedStaff,
    });
  } catch (error) {
    console.error("Error generating access code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
