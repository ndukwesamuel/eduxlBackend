import ServiceVendor from "../models/serviceVendor.js";
import { cloudinary } from "../helpers/cloudinaryConfig.js";
import VendorCategory from "../models/vendorCategory.js";
import VendorSubCategory from "../models/vendorSubCategory.js";
import mongoose from "mongoose";

import Review from "../models/serviceVendorReviews.js";
import slugify from "slugify";

// export const createServiceVendorAccount = async (req, res) => {
//   try {
//     // let user_id = req.user._id;
//     let clan_id = req.clan;

//     const {
//       FullName,
//       // last_name,
//       about_me,
//       address,
//       gender,
//       phone_number,
//       years_of_experience,
//       // category,
//       // sub_category,
//       opens,
//       closes,
//     } = req.body;
//     // const imageFile = req.file;
//     const imageFile = req.files;

//     let photoUrl = "";
//     let photoPublicId = "";
//     if (imageFile) {
//       const imageResult = await cloudinary.uploader.upload(
//         imageFile.tempFilePath
//       );
//       photoUrl = imageResult.secure_url;
//       photoPublicId = imageResult.public_id;
//     }

//     // const newVendor = new ServiceVendor({
//     //   FullName,
//     //   // last_name,
//     //   about_me,
//     //   photo: { url: photoUrl, photoPublicId: photoPublicId },
//     //   address,
//     //   gender,
//     //   phone_number,
//     //   years_of_experience,
//     //   // category,
//     //   // sub_category,
//     //   opens,
//     //   closes,
//     //   clan: clan_id?._id,
//     // });

//     // const savedVendor = await newVendor.save();

//     res.status(201).json({
//       success: true,
//       message: "Vendor account created successfully",
//       // vendor: savedVendor,
//       imageResult,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create vendor account",
//       errMsg: error.message,
//     });
//   }
// }; //fix

export const createServiceVendorAccount = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded",
      });
    }
    let clan_id = req.clan;
    const {
      FullName,
      about_me,
      address,
      gender,
      phone_number,
      years_of_experience,
      opens,
      closes,
    } = req.body;

    let photoUrl = "";
    let photoPublicId = "";

    // Handle file upload with express-fileupload
    const imageFile = req.files.photo; // 'image' should match the field name in your form
    const imageResult = await cloudinary.uploader.upload(
      imageFile.tempFilePath,
      {
        resource_type: "auto",
        folder: "market_products",
      }
    );

    // Here you would typically save to your database
    const newVendor = new ServiceVendor({
      FullName,
      about_me,
      photo: { url: imageResult.secure_url, public_id: imageResult.public_id },
      address,
      gender,
      phone_number,
      years_of_experience,
      opens,
      closes,
      clan: clan_id?._id,
    });

    await newVendor.save();

    res.status(201).json({
      success: true,
      message: "Vendor account created successfully",
      vendor: newVendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create vendor account",
      error: error.message,
    });
  }
};

export const updateServiceVendorAccount = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      first_name,
      last_name,
      about_me,
      address,
      gender,
      phone_number,
      years_of_experience,
      // category,
      // sub_category,
      opens,
      closes,
    } = req.body;
    const imageFile = req.file;

    const vendor = await ServiceVendor.findById({ _id: vendorId });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor Not Found" });
    }

    const updateFields = {
      first_name: first_name || vendor.first_name,
      last_name: last_name || vendor.last_name,
      about_me: about_me || vendor.about_me,
      address: address || vendor.address,
      gender: gender || vendor.gender,
      phone_number: phone_number || vendor.phone_number,
      years_of_experience: years_of_experience || vendor.years_of_experience,
      // category: category || vendor.category,
      // sub_category: sub_category || vendor.sub_category,
      opens: opens || vendor.opens,
      closes: closes || vendor.closes,
    };

    if (imageFile) {
      if (vendor.photo && vendor.photo.photoPublicId) {
        await cloudinary.uploader.destroy(vendor.photo.photoPublicId);
      }
      const imageResult = await cloudinary.uploader.upload(imageFile.path);

      updateFields.photo = {
        url: imageResult.secure_url || vendor.photo.url,
        photoPublicId: imageResult.public_id || vendor.photo.photoPublicId,
      };
    }

    const updatedVendor = await ServiceVendor.findByIdAndUpdate(
      vendorId,
      updateFields,
      { new: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({
      success: true,
      message: "Vendor account updated successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor account",
      error: error.message,
    });
  }
};

export const getAllVendors = async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;
  let clan_id = req.clan;

  try {
    const vendors = await ServiceVendor.find({ clan: clan_id?._id }).populate(
      "clan"
    );

    const totalVendors = await ServiceVendor.countDocuments();

    res.json({
      success: true,
      message: "All vendors fetched successfully",
      // currentPage: page,
      // totalPages: Math.ceil(totalVendors / limit),
      vendors: vendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

export const UsergetAllVendors = async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;
  let clan_id = req.clan;

  try {
    const vendors = await ServiceVendor.find({ clan: clan_id?._id }).populate(
      "clan"
    );
    // .populate("category");
    // .populate("sub_category")
    // .skip(skip)
    // .limit(limit);

    const totalVendors = await ServiceVendor.countDocuments();

    res.json({
      success: true,
      message: "All vendors fetched successfully",
      // currentPage: page,
      // totalPages: Math.ceil(totalVendors / limit),
      vendors: vendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await ServiceVendor.findById({ _id: vendorId });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({
      success: true,
      message: "Vendor fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
      error: error.message,
    });
  }
};

export const getVendorsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const vendors = await ServiceVendor.find({ category: categoryId })
      .skip(skip)
      .limit(limit);

    if (!vendors) {
      return res
        .status(404)
        .json({ success: false, message: "No vendor found" });
    }

    const totalVendors = await ServiceVendor.countDocuments({
      category: categoryId,
    });

    res.json({
      success: true,
      message: "Vendors fetched by category successfully",
      currentPage: page,
      totalPages: Math.ceil(totalVendors / limit),
      vendors: vendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

export const searchVendorByCategoryOrSubCategory = async (req, res) => {
  const { keyword } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Regex wildcard
    const regexPattern = new RegExp(slugify(keyword, { lower: true }) + ".*");

    // Search for categories and subcategories matching the regex pattern
    const [cat, cat2] = await Promise.all([
      VendorCategory.findOne({ slug: regexPattern }),
      VendorSubCategory.findOne({ slug: regexPattern }),
    ]);

    const vendors = await ServiceVendor.find({
      $or: [
        { category: cat ? cat._id : null },
        { sub_category: cat2 ? cat2._id : null },
      ],
    })
      .skip(skip)
      .limit(limit);

    const totalVendors = await ServiceVendor.countDocuments({
      $or: [
        { category: cat ? cat._id : null },
        { sub_category: cat2 ? cat2._id : null },
      ],
    });

    res.json({
      currentPage: page,
      vendorsFound: totalVendors,
      totalPages: Math.ceil(totalVendors / limit),
      vendors,
    });
  } catch (error) {
    console.error("Error searching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search vendors",
      errorMsg: error.message,
    });
  }
};

export const deleteVendorAccount = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await ServiceVendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (vendor.photo && vendor.photo.photoPublicId) {
      await cloudinary.uploader.destroy(vendor.photo.photoPublicId);
    }

    const deletedVendor = await ServiceVendor.findByIdAndDelete(vendorId);

    res.json({
      success: true,
      message: `Vendor account ${deletedVendor._id} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vendor account",
      error: error.message,
    });
  }
};

export const Like_and_Dislike_Service_Vendor = async (req, res) => {
  let clan_id = req.clan;
  let { serviceId } = req.params;
  let userId = req.user._id;

  try {
    const vendor = await ServiceVendor.findOne({
      _id: serviceId,
      clan: clan_id?._id,
    }).populate("clan");

    if (!vendor) {
      return res.status(404).send("Vendor not found");
    }

    // Initialize the likedBy array if it doesn't exist
    const isLiked = vendor.servicelikes.includes(userId);
    // const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // User has already liked the post, so unlike it
      vendor.servicelikes = vendor.servicelikes.filter(
        (likeId) => likeId.toString() !== userId
      );
    } else {
      // User has not liked the post, so like it
      vendor.servicelikes.push(userId);
    }
    await vendor.save();

    res.json({
      success: true,
      message: "All vendors fetched successfully",
      isLiked,
      // serviceId,
      vendor,
      // clan_id,
      // serviceID,
      // vendor,
      // currentPage: page,
      // totalPages: Math.ceil(totalVendors / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

export const Delete_Vendor = async (req, res) => {
  let clan_id = req.clan;
  let { serviceId } = req.params;
  let userId = req.user._id;
  let { vendorId } = req.query;

  try {
    const serviceVendorRes = await ServiceVendor.findByIdAndDelete(vendorId);

    if (!serviceVendorRes) {
      return res.status(404).json({
        success: false,
        message: "Service vendor not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service vendor deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting the service vendor.",
      error: error.message,
    });
  }
};

export const Service_Vendor_Review = async (req, res) => {
  let userId = req.user._id;
  const { vendorId, rating, comment } = req.body;

  // Start a Mongoose session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendor = await ServiceVendor.findById(vendorId).session(session);
    if (!vendor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Create a new review
    const review = await Review.create(
      [{ user: userId, vendor: vendorId, rating, comment }],
      { session }
    );

    // Add the review to the vendor's reviews array
    vendor.reviews.push(review[0]._id);

    // Calculate the new average rating
    const allReviews = await Review.find({ vendor: vendorId }).session(session);
    const avgRating =
      allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
    vendor.avgRating = avgRating;

    // Save the vendor with the updated reviews and average rating
    await vendor.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json({ message: "Review added successfully", review: review[0] });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
};

export const GetVendorReview = async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;
  // let clan_id = req.clan;
  let { vendorid } = req.query;

  let reviewQuery = {};
  if (vendorid) {
    reviewQuery.vendor = vendorid; // Filter by vendor ID if provided
  }

  try {
    const reviews = await Review.find(reviewQuery).populate("user vendor");

    res.json({
      success: true,
      reviews,
      message: "All Review fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};
