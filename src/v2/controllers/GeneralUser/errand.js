import Errand from "../../../models/errand.js";
import { processItemImages } from "../../utils/processItemImages.js";
import { validateErrandData } from "../../utils/errandValidator.js";
import mongoose from "mongoose";
import TransactionHistory from "../../../models/TransactionHistory.js";
import User from "../../../models/user.js";
import user from "../../../models/user.js";
import { hashPassword } from "../../../helpers/auth.js";
import { getRecipientsByEmails } from "../../../services/Userservice.js";
// cloudinary
import slugify from "slugify";

import { v2 as cloudinary } from "cloudinary";
import walletdata from "../../../models/wallet.js"; //"../../../models/wallet.js";

cloudinary.config({
  cloud_name: "dkzds0azx", // process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "617445194715168", //process.env.CLOUDINARY_API_KEY,
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk", // process.env.CLOUDINARY_API_SECRET,
});

export const PickupErrands = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      title,
      deliveryAddress,
      isWithinEstate,
      description,
      phoneNumber,
      pickUpAddress,
      // pickupTime,
    } = req.body;

    const estateFlag =
      isWithinEstate === "true" || isWithinEstate === true ? true : false;
    let uploadedImages = [];

    const deliveryFee = estateFlag ? 500 : 1000;

    // ✅ Check wallet balance before proceeding
    const wallet = await walletdata.findOne({ user: userId });
    console.log({
      sdsd: wallet,
    });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found. Please set up your wallet.",
      });
    }

    let maindelevery = deliveryFee * 100;

    if (wallet.balance < maindelevery) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance. Please fund your wallet.",
      });
    }

    if (!req.files || !Object.keys(req.files).length) {
      console.log("No files found in the request");
    } else {
      // Check if images field exists
      if (!req.files.images) {
        console.log("No 'images' field in uploaded files");
        console.log("Available fields:", Object.keys(req.files));
      } else {
        // Get the image files
        const imageFiles = req.files.images;
        // Convert to array if single file
        const filesArray = Array.isArray(imageFiles)
          ? imageFiles
          : [imageFiles];
        console.log(`Found ${filesArray.length} files to upload`);

        // Process each file
        uploadedImages = await Promise.all(
          filesArray.map(async (file) => {
            try {
              console.log(
                `Processing file: ${file.name}, Size: ${file.size}, Type: ${file.mimetype}`
              );
              console.log(`Temp file path: ${file.tempFilePath}`);

              // Verify the file has content
              if (!file.size || file.size === 0) {
                console.error("File has zero size:", file.name);
                return { error: "File has zero size", fileName: file.name };
              }

              // Force cloudinary to recheck its config
              if (!cloudinary.config().cloud_name) {
                console.error("Cloudinary configuration missing or invalid");
                console.log("Environment variables:", {
                  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
                    ? "Set"
                    : "Not set",
                  API_KEY: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
                  API_SECRET: process.env.CLOUDINARY_API_SECRET
                    ? "Set"
                    : "Not set",
                });
                return {
                  error: "Cloudinary not configured properly",
                  fileName: file.name,
                };
              }

              console.log("Attempting Cloudinary upload...");
              // Upload to cloudinary
              const imageResult = await cloudinary.uploader.upload(
                file.tempFilePath,
                {
                  resource_type: "auto",
                  folder: "market_products",
                }
              );

              console.log(
                `Successfully uploaded ${file.name} to Cloudinary at ${imageResult.secure_url}`
              );
              return {
                url: imageResult.secure_url,
                imagePublicId: imageResult.public_id,
                otherdata: imageResult,
              };
            } catch (err) {
              console.error(`Error uploading file ${file.name}:`, err);
              return {
                error: `Upload failed: ${err.message || "Unknown error"}`,
                fileName: file.name,
                details: err.stack || JSON.stringify(err),
              };
            }
          })
        );
      }
    }

    // await errand.save();

    // ✅ Create errand with status = assigned
    const errand = new Errand({
      title,
      deliveryAddress,
      pickUpAddress,
      isWithinEstate: estateFlag,
      description,
      phoneNumber,
      images: uploadedImages,
      user: userId,
      type: "pickup",
      pickupLocations: [],
      totalPrice: 0,
      serviceCharge: 0,
      deliveryFee,
      totalAmount: deliveryFee,
      status: "assigned", // 🔥 Set status immediately
    });

    await errand.save();

    wallet.balance -= maindelevery; // convert back to kobo
    await wallet.save();

    return res.status(200).json({
      // success: true,
      // mainWallet,
      // deliveryFee,
      // wallet,
      data: { wallet, errand },
    });
  } catch (error) {
    console.error(`Error updating errand status to `, error);
    return res.status(500).json({
      success: false,
      message: "Failed to update errand status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

function validatePickupLocations(pickupLocations) {
  for (const [i, location] of pickupLocations.entries()) {
    if (!location.name?.trim() || !location.address?.trim()) {
      throw new Error(`Location ${i + 1} must have name and address`);
    }

    if (!Array.isArray(location.items) || location.items.length === 0) {
      throw new Error(
        `Location '${location.name}' must have at least one item`
      );
    }

    for (const [j, item] of location.items.entries()) {
      if (!item.name?.trim()) {
        throw new Error(
          `Item ${j + 1} at location '${location.name}' must have a name`
        );
      }

      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(
          `Item '${item.name}' must have a valid positive quantity`
        );
      }

      const price = parseFloat(item.price);
      if (isNaN(price) || price < 0) {
        throw new Error(
          `Item '${item.name}' must have a valid non-negative price`
        );
      }
    }
  }
}

// Fund wallet (either add to balance or overwrite)
export const fundWallet = async (req, res) => {
  // try {
  //   const wallet = await walletdata.findById("6808da7a8b7200b3d2fb2832");
  //   wallet.balance = 20000000;
  //   await wallet.save();
  //   return res.status(200).json({
  //     success: true,
  //     message: "Wallet funded successfully",
  //     data: wallet,
  //   });
  // } catch (error) {
  //   console.error(error);
  //   return res.status(500).json({
  //     success: false,
  //     message: "Server error",
  //     error: error.message,
  //   });
  // }
};

// export const createAndAssignErrand = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       title,
//       deliveryAddress,
//       description,
//       pickupLocations,
//       phoneNumber,
//       isWithinEstate,
//     } = req.body;

//     const userId = req.user._id;

//     console.log({
//       lakaka: userId,
//     });

//     // ✅ Validate inputs
//     if (!title?.trim() || !deliveryAddress?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and delivery address are required",
//       });
//     }

//     if (!Array.isArray(pickupLocations) || pickupLocations.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one pickup location is required",
//       });
//     }

//     // ✅ Validate pickupLocations
//     try {
//       validatePickupLocations(pickupLocations);
//     } catch (validationError) {
//       return res.status(400).json({
//         success: false,
//         message: validationError.message,
//       });
//     }

//     // ✅ Fetch wallet and user
//     const user = await User.findById(userId).session(session);
//     const wallet = await walletdata.findOne({ user: userId }).session(session);

//     if (!wallet) {
//       return res.status(400).json({
//         success: false,
//         message: "User wallet not found",
//       });
//     }

//     // ✅ Prepare errand instance (status = assigned directly)
//     const newErrand = new Errand({
//       title: title.trim(),
//       deliveryAddress: deliveryAddress.trim(),
//       description: description?.trim(),
//       user: userId,
//       pickupLocations,
//       status: "assigned",
//       phoneNumber,
//       isWithinEstate: isWithinEstate ?? true,
//     });

//     // Pre-save hook will compute totalPrice, deliveryFee, totalAmount
//     await newErrand.validate();

//     const walletBalanceInKobo = wallet.balance; // already in kobo
//     const errandPriceInKobo = Math.round(newErrand.totalPrice * 100); // naira → kobo
//     const errandAmountInKobo = Math.round(newErrand.totalAmount * 100); // naira → kobo

//     let deductionAmount, walletUpdateResponse;

//     if (user.freeErrandsRemaining > 0) {
//       if (walletBalanceInKobo < errandPriceInKobo) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: "Insufficient funds in wallet for free errand",
//           requiredAmount: newErrand.totalPrice, // still return in naira for user clarity
//           currentBalance: wallet.balance / 100, // convert to naira for response
//         });
//       }

//       deductionAmount = errandPriceInKobo;
//       wallet.balance -= deductionAmount;
//       user.freeErrandsRemaining -= 1;

//       walletUpdateResponse = {
//         initialBalance: walletBalanceInKobo / 100, // naira
//         deductionAmount: deductionAmount / 100, // naira
//         remainingBalance: wallet.balance / 100, // naira
//         currency: "NGN",
//         message: `Free errand used. You have ${user.freeErrandsRemaining} free errands remaining.`,
//       };
//     } else {
//       if (walletBalanceInKobo < errandAmountInKobo) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: "Insufficient funds in wallet",
//           requiredAmount: newErrand.totalAmount,
//           currentBalance: wallet.balance / 100, // naira
//         });
//       }

//       deductionAmount = errandAmountInKobo;
//       wallet.balance -= deductionAmount;

//       walletUpdateResponse = {
//         initialBalance: walletBalanceInKobo / 100, // naira
//         deductionAmount: deductionAmount / 100, // naira
//         remainingBalance: wallet.balance / 100, // naira
//         currency: "NGN",
//       };
//     }

//     // ✅ Persist changes
//     await wallet.save({ session });
//     await user.save({ session });
//     const createdErrand = await newErrand.save({ session });

//     await session.commitTransaction();

//     // ✅ Populate for response
//     const populatedErrand = await Errand.findById(createdErrand._id).populate(
//       "user",
//       "name email"
//     );
//     // .populate("clan", "name");

//     return res.status(201).json({
//       success: true,
//       message: "Errand created and assigned successfully",
//       data: {
//         errand: populatedErrand,
//         wallet: walletUpdateResponse,
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating & assigning errand:", error);

//     return res.status(500).json({
//       success: false,
//       message:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : "Failed to create and assign errand",
//     });
//   } finally {
//     session.endSession();
//   }
// };

export const createAndAssignErrand = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    const {
      title,
      deliveryAddress,
      description,
      pickupLocations,
      phoneNumber,
      isWithinEstate, // 👈 Added this
    } = req.body;

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const wallet = await walletdata.findOne({ user: userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    // create new errand
    const newErrand = new Errand({
      title: title.trim(),
      deliveryAddress: deliveryAddress.trim(),
      description: description?.trim(),
      user: userId,
      pickupLocations,
      status: "assigned",
      phoneNumber,
      isWithinEstate: isWithinEstate ?? true, // 👈 fix for always defaulting
    });

    // pre-save hook will calculate deliveryFee, totalPrice, totalAmount
    await newErrand.save({ session });

    // Wallet deduction logic
    const walletBalanceInKobo = wallet.balance; // already in Kobo
    const errandPriceInKobo = newErrand.totalPrice * 100;
    const errandAmountInKobo = newErrand.totalAmount * 100;

    let deductionAmount = 0;

    if (user.freeErrandsRemaining > 0) {
      if (walletBalanceInKobo < errandPriceInKobo) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Insufficient funds in wallet for free errand",
          requiredAmount: newErrand.totalPrice,
          currentBalance: wallet.balance / 100,
        });
      }

      deductionAmount = errandPriceInKobo;
      wallet.balance = wallet.balance - deductionAmount;
      user.freeErrandsRemaining -= 1;
    } else {
      if (walletBalanceInKobo < errandAmountInKobo) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Insufficient funds in wallet",
          requiredAmount: newErrand.totalAmount,
          currentBalance: wallet.balance / 100,
        });
      }

      deductionAmount = errandAmountInKobo;
      wallet.balance = wallet.balance - deductionAmount;
    }

    // Logging (safe for debugging)
    console.log({
      userId,
      walletBalanceBefore: walletBalanceInKobo,
      deductionAmount,
      walletBalanceAfter: wallet.balance,
      isWithinEstate: newErrand.isWithinEstate,
      errandTotalPrice: newErrand.totalPrice,
      errandTotalAmount: newErrand.totalAmount,
    });

    await wallet.save({ session });
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Errand created and assigned successfully",
      data: newErrand,
      walletBalance: wallet.balance / 100, // return in Naira
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating errand:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
};
