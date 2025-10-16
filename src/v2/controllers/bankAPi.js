import clan from "../../models/clan.js";
import UserProfile from "../../models/profile.js";
import user from "../../models/user.js";
import VirtualAccount from "../../models/VirtualAccount.js";
import { createVirtualAccount } from "../services/bankingAPi.js";
import axios from "axios"; // For making API calls

export const VirtualAccountController = async (req, res) => {
  try {
    // Call the service function, isolating the external API logic
    const accountDetails = await createVirtualAccount();

    // Send a successful response (HTTP 201 Created)
    return res.status(201).json({
      success: true,
      message: "Virtual account successfully created via external API.",
      data: accountDetails,
    });
  } catch (error) {
    // Handle errors thrown by the Service layer
    console.error(`[Controller] Error processing virtual account:`, error);

    // If the service threw an error with a status (from external API)
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message,
      // Include external data if available
      externalErrorDetails: error.data || null,
    });
  }
};

export const GetUserVirtualAccountControllerFromDB = async (req, res) => {
  try {
    // Call the service function, isolating the external API logic
    //   const accountDetails = await createVirtualAccount();
    const accountDetails = await VirtualAccount.find({}).populate(
      "user",
      "name email"
    );

    // Send a successful response (HTTP 201 Created)
    return res.status(201).json({
      success: true,
      message: "Virtual account successfully created via external API.",
      data: accountDetails,
    });
  } catch (error) {
    // Handle errors thrown by the Service layer
    console.error(`[Controller] Error processing virtual account:`, error);

    // If the service threw an error with a status (from external API)
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message,
      // Include external data if available
      externalErrorDetails: error.data || null,
    });
  }
};

// export const CreateAVirtualAccountController = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const existingAccount = await VirtualAccount.findOne({ user: userId });
//     if (existingAccount) {
//       return res.status(200).json({
//         message: "Virtual account already exists for this user.",
//         account: existingAccount,
//       });
//     }

//     const user = await UserProfile.findOne({ user: userId })
//       .populate({
//         path: "user",
//         select: "name email mobileNo", // Ensure mobileNo is being selected if it exists
//       })
//       .select("photo phoneNumber address");

//     if (!user || !user.phoneNumber) {
//       throw new Error("User not found or phone number is missing.");
//     }

//     // Split name for first_name and last_name (simple approach)
//     const [firstName, ...lastNameParts] = user.user.name.split(" ");
//     const lastName = lastNameParts.join(" ") || firstName;

//     const payload = {
//       currency: "NGN",
//       customer: {
//         bvn: "22222222222",
//         first_name: firstName,
//         last_name: lastName,
//         email: user.user.email,
//         mobile_no: "08023431321", //user.phoneNumber, // THIS IS THE FIELD CAUSING THE ERROR
//       },
//     };

//     let EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
//     let EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

//     // 3. CALL EXTERNAL API
//     const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
//       headers: {
//         "x-api-key": EXTERNAL_API_KEY,
//         "Content-Type": "application/json",
//       },
//     });
//     const accountData = apiResponse.data.data; // Adjust based on actual API response structure

//     // 4. SAVE NEW ACCOUNT
//     const newVirtualAccount = await VirtualAccount.create({
//       user: userId,
//       providerReference: accountData.reference, // Use the unique ref from the API
//       accountName: accountData.account_name,
//       accountNumber: accountData.account_number,
//       bankName: accountData.bank_name,
//       currency: payload.currency,
//       email: user.user.email,
//       phoneNumber: user.phoneNumber,
//     });

//     res.status(201).json({
//       message: "Virtual account created successfully.",
//       account: newVirtualAccount,
//       accountData,
//     });

//     // ... (Your existing logic for handling successful response) ...
//   } catch (error) {
//     console.error("Error processing virtual account:", error);

//     // Handle non-Axios or network errors
//     res.status(404).json({
//       message: "An internal server error occurred.",
//       error: error.message,
//     });
//   }
// };

export const CreateAVirtualAccountController = async (req, res) => {
  const userId = req.user._id; // Assuming auth middleware provides req.user

  try {
    // 1. Check for existing account
    const existingAccount = await VirtualAccount.findOne({ user: userId });
    if (existingAccount) {
      return res.status(200).json({
        message: "Virtual account already exists for this user.",
        account: existingAccount,
      });
    }

    // 2. Fetch user data (User and UserProfile)
    // Populate the 'user' field from the User model into the UserProfile document
    const userProfile = await UserProfile.findOne({ user: userId })
      .populate({
        path: "user",
        // Ensure you select all necessary fields from the main User model
        select: "name email",
      })
      .select("phoneNumber"); // Only select fields needed from UserProfile

    // Check if user and required data exist
    if (!userProfile || !userProfile.user || !userProfile.phoneNumber) {
      // Return a 404/400 if critical user data is missing
      return res.status(400).json({
        message:
          "User not found or essential profile data (name, email, phone) is missing.",
      });
    }

    // Prepare customer details for external API
    const user = userProfile.user;
    const [firstName, ...lastNameParts] = user.name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    const payload = {
      currency: "NGN",
      customer: {
        bvn: "22222222222", // NOTE: Hardcoded BVN should be handled securely or fetched
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        mobile_no: userProfile.phoneNumber, // Use the fetched phone number
      },
    };

    const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
    const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

    // 3. CALL EXTERNAL API
    const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
      headers: {
        "x-api-key": EXTERNAL_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const accountData = apiResponse.data.data; // Adjust based on actual API response structure

    // Basic validation of external response
    if (!accountData || !accountData.reference || !accountData.account_number) {
      return res.status(502).json({
        message: "External service returned an invalid account data structure.",
        details: apiResponse.data,
      });
    }

    // 4. SAVE NEW ACCOUNT
    const newVirtualAccount = await VirtualAccount.create({
      user: userId,
      providerReference: accountData.reference,
      accountName: accountData.account_name,
      accountNumber: accountData.account_number,
      bankName: accountData.bank_name,
      currency: payload.currency,
      email: user.email,
      phoneNumber: userProfile.phoneNumber,
    });

    // 5. Success Response
    return res.status(201).json({
      message: "Virtual account created successfully.",
      account: newVirtualAccount,
      // accountData, // You might choose to omit the raw external data
    });
  } catch (error) {
    console.error("Error creating virtual account:", error);

    // Differentiate between Axios (API) errors and other errors
    if (axios.isAxiosError(error) && error.response) {
      // Handle external API errors (e.g., 4xx, 5xx from the payment provider)
      return res.status(error.response.status).json({
        message: "Failed to create virtual account with external provider.",
        externalMessage:
          error.response.data.message || "Unknown external error.",
        errorDetails: error.response.data, // Include useful error details
      });
    }

    // Handle Mongoose/Internal/Network errors
    return res.status(500).json({
      message:
        "Server error occurred while processing virtual account request.",
      error: error.message,
    });
  }
};
export const GetUserVirtualAccountController = async (req, res) => {
  const userId = req.user._id;

  try {
    const virtualAccount = await VirtualAccount.findOne({ user: userId });

    // 3. Handle the response:
    // If an account is found, send it.
    if (virtualAccount) {
      return res.status(200).json({
        success: true,
        message: "Virtual account retrieved successfully.",
        data: virtualAccount,
      });
    }

    return res.status(200).json({
      success: true,
      message: "No virtual account found for this user.",
      data: null, // Explicitly return null or an empty object {}
    });
  } catch (error) {
    // 4. Handle server or database errors
    console.error("Error fetching virtual account:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const CaptainCourt = async (req, res) => {
  // const userId = req.user._id; // Assuming auth middleware provides req.user
  let { email, phone_num } = req.body;
  // const userId = await user.findOne({})
  const user_data = await user.findOne({ email: email.toLowerCase() });
  let userId = user_data._id;

  try {
    // 1. Check for existing account
    const existingAccount = await VirtualAccount.findOne({ user: userId });
    if (existingAccount) {
      return res.status(200).json({
        message: "Virtual account already exists for this user.",
        account: existingAccount,
      });
    }

    // 2. Fetch user data (User and UserProfile)
    // Populate the 'user' field from the User model into the UserProfile document
    const userProfile = await UserProfile.findOne({ user: userId })
      .populate({
        path: "user",
        // Ensure you select all necessary fields from the main User model
        select: "name email",
      })
      .select("phoneNumber"); // Only select fields needed from UserProfile

    // Check if user and required data exist
    // if (!userProfile || !userProfile.user || !userProfile.phoneNumber) {
    //   // Return a 404/400 if critical user data is missing
    //   return res.status(400).json({
    //     message:
    //       "User not found or essential profile data (name, email, phone) is missing.",
    //   });
    // }

    // Prepare customer details for external API
    const user = userProfile.user;
    const [firstName, ...lastNameParts] = user.name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    const payload = {
      currency: "NGN",
      customer: {
        bvn: "22222222222", // NOTE: Hardcoded BVN should be handled securely or fetched
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        mobile_no: phone_num, //userProfile.phoneNumber, // Use the fetched phone number
      },
    };

    const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
    const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

    // 3. CALL EXTERNAL API
    const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
      headers: {
        "x-api-key": EXTERNAL_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const accountData = apiResponse.data.data; // Adjust based on actual API response structure

    // Basic validation of external response
    if (!accountData || !accountData.reference || !accountData.account_number) {
      return res.status(502).json({
        message: "External service returned an invalid account data structure.",
        details: apiResponse.data,
      });
    }

    // 4. SAVE NEW ACCOUNT
    const newVirtualAccount = await VirtualAccount.create({
      user: userId,
      providerReference: accountData.reference,
      accountName: accountData.account_name,
      accountNumber: accountData.account_number,
      bankName: accountData.bank_name,
      currency: payload.currency,
      email: user.email,
      phoneNumber: phone_num, // userProfile.phoneNumber || phone_num,
    });

    // 5. Success Response
    return res.status(201).json({
      message: "Virtual account created successfully.",
      account: newVirtualAccount,
      // accountData, // You might choose to omit the raw external data
    });
  } catch (error) {
    console.error("Error creating virtual account:", error);

    // Differentiate between Axios (API) errors and other errors
    if (axios.isAxiosError(error) && error.response) {
      // Handle external API errors (e.g., 4xx, 5xx from the payment provider)
      return res.status(error.response.status).json({
        message: "Failed to create virtual account with external provider.",
        externalMessage:
          error.response.data.message || "Unknown external error.",
        errorDetails: error.response.data, // Include useful error details
      });
    }

    // Handle Mongoose/Internal/Network errors
    return res.status(500).json({
      message:
        "Server error occurred while processing virtual account request.",
      error: error.message,
    });
  }
};

// export const CaptainCourt = async (req, res) => {
//   try {
//     let { email } = req.body;
//     const user_Data = await user.findOne({ email: email.toLowerCase() });
//     if (!user_Data) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const clanid = "6807bbbf6152e3e0bb049580";
//     const clan_Data = await clan.findById(clanid);
//     if (!clan_Data) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     // Filter members to only those with a valid phone number
//     const membersWithPhone = clan_Data.members.filter(
//       (member) => member.phonenumber && member.phonenumber.trim() !== ""
//     );

//     return res.status(200).json({
//       message: "Members with phone number retrieved successfully.",
//       members: membersWithPhone,
//     });
//   } catch (error) {
//     console.error("Error fetching clan data:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// import user from "../models/user.js";
// import clan from "../models/clan.js";
// import UserProfile from "../models/userProfile.js";

export const CaptainCourt__test_fake = async (req, res) => {
  try {
    let { email } = req.body;

    const user_Data = await user.findOne({ email: email.toLowerCase() });
    if (!user_Data) {
      return res.status(404).json({ message: "User not found" });
    }

    const clanid = "6807bbbf6152e3e0bb049580";
    const clan_Data = await clan.findById(clanid);
    if (!clan_Data) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // 🔹 Filter members that have a phone number
    const membersWithPhone = clan_Data.members.filter(
      (member) => member.phonenumber && member.phonenumber.trim() !== ""
    );

    // 🔹 Build combined structure
    const combinedMembers = await Promise.all(
      membersWithPhone.map(async (member) => {
        const userData = await user.findById(member.user).select("email");
        const profileData = await UserProfile.findOne({
          user: member.user,
        }).select("phoneNumber");

        return {
          email: userData?.email || null,
          phoneNumber: profileData?.phoneNumber || member.phonenumber || null,
          memberDetails: {
            _id: member._id,
            user: member.user,
            status: member.status,
            homeAddress: member.homeAddress,
            memberCode: member.memberCode,
          },
        };
      })
    );

    return res.status(200).json({
      message: "Members with phone number retrieved successfully.",
      members: combinedMembers,
    });
  } catch (error) {
    console.error("Error fetching clan data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const CaptainCourt__test = async (req, res) => {
  try {
    let { email } = req.body;

    const user_Data = await user.findOne({ email: email.toLowerCase() });
    if (!user_Data) {
      return res.status(404).json({ message: "User not found" });
    }

    const clanid = "6807bbbf6152e3e0bb049580";
    const clan_Data = await clan.findById(clanid);
    if (!clan_Data) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // 🔹 Filter members that have a phone number
    const membersWithPhone = clan_Data.members.filter(
      (member) => member.phonenumber && member.phonenumber.trim() !== ""
    );

    // 🔹 Build combined structure and filter for Nigerian numbers
    const combinedMembers = await Promise.all(
      membersWithPhone.map(async (member) => {
        const userData = await user.findById(member.user).select("email");
        const profileData = await UserProfile.findOne({
          user: member.user,
        }).select("phoneNumber");

        const phone = profileData?.phoneNumber || member.phonenumber || "";
        const formattedPhone = phone.trim();

        return {
          email: userData?.email || null,
          phoneNumber: formattedPhone,
          memberDetails: {
            _id: member._id,
            user: member.user,
            status: member.status,
            homeAddress: member.homeAddress,
            memberCode: member.memberCode,
          },
        };
      })
    );

    // 🔹 Keep only Nigerian numbers (start with 0 or +234)
    const nigerianMembers = combinedMembers.filter((member) => {
      const phone = member.phoneNumber || "";
      return phone.startsWith("0") || phone.startsWith("+234");
    });

    return res.status(200).json({
      message: "Nigerian members with phone numbers retrieved successfully.",
      total: nigerianMembers.length,
      members: nigerianMembers,
    });
  } catch (error) {
    console.error("Error fetching clan data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// import axios from "axios";
// // Assume your models are imported here:
// // import { user, clan, UserProfile, VirtualAccount } from '../models';

// /**
//  * 🚀 Processes virtual account creation for all Nigerian members of a specific clan.
//  * Iterates through members, checks for existing accounts, and attempts creation
//  * using the external API for those who don't have one.
//  * * NOTE: This function requires the same environment variables (EXTERNAL_BASE_URL, EXTERNAL_API_KEY)
//  * and models (user, clan, UserProfile, VirtualAccount) as CaptainCourt.
//  * * @param {string} clanid The ID of the clan to process.
//  * @returns {object} A summary report of the processing operation.
//  */
// export const processAllMemberVirtualAccounts = async (req, res) => {
//   const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Your hardcoded clanid

//   // Initialize counters and report structure
//   const report = {
//     totalMembers: 0,
//     alreadyExisting: 0,
//     successfullyCreated: 0,
//     skippedDueToMissingData: 0,
//     failedToCreate: [],
//     successfulCreations: [],
//   };

//   try {
//     // 1. --- Core Logic from CaptainCourt__test to get Nigerian members ---

//     const clan_Data = await clan.findById(CLAN_ID);
//     if (!clan_Data) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     // Filter members with a phone number (same as CaptainCourt__test)
//     const membersWithPhone = clan_Data.members.filter(
//       (member) => member.phonenumber && member.phonenumber.trim() !== ""
//     );

//     // Build combined structure (user.findById and UserProfile.findOne can be optimized later, but sticking to your structure)
//     const combinedMembers = await Promise.all(
//       membersWithPhone.map(async (member) => {
//         // Optimized: Fetch email and phoneNumber in one go if possible, but following your original structure.
//         const userData = await user.findById(member.user).select("email");
//         const profileData = await UserProfile.findOne({
//           user: member.user,
//         }).select("phoneNumber");

//         const phone = profileData?.phoneNumber || member.phonenumber || "";
//         const formattedPhone = phone.trim();

//         return {
//           userId: member.user, // Crucial for account creation
//           email: userData?.email || null,
//           phoneNumber: formattedPhone,
//           memberCode: member.memberCode,
//         };
//       })
//     );

//     // Keep only Nigerian numbers (start with 0 or +234)
//     const nigerianMembers = combinedMembers.filter((member) => {
//       const phone = member.phoneNumber || "";
//       return (
//         (phone.startsWith("0") || phone.startsWith("+234")) && member.userId
//       );
//     });

//     report.totalMembers = nigerianMembers.length;

//     // 2. --- Account Creation Logic (Adapted from CaptainCourt) ---

//     const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
//     const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

//     // Use Promise.allSettled to run creation concurrently and handle all outcomes
//     const processingPromises = nigerianMembers.map(async (member) => {
//       const userId = member.userId;
//       const memberInfo = {
//         userId,
//         email: member.email,
//         memberCode: member.memberCode,
//       };

//       try {
//         // A. Check for existing account
//         const existingAccount = await VirtualAccount.findOne({ user: userId });
//         if (existingAccount) {
//           report.alreadyExisting++;
//           return { status: "already_exists", memberInfo };
//         }

//         // B. Fetch detailed user data needed for external API
//         const userProfile = await UserProfile.findOne({ user: userId })
//           .populate({ path: "user", select: "name email" })
//           .select("phoneNumber");

//         // Check if user and required data exist for creation
//         if (
//           !userProfile ||
//           !userProfile.user ||
//           !userProfile.phoneNumber ||
//           !userProfile.user.name
//         ) {
//           report.skippedDueToMissingData++;
//           return { status: "skipped_missing_data", memberInfo };
//         }

//         const userDetail = userProfile.user;
//         const [firstName, ...lastNameParts] = userDetail.name.split(" ");
//         const lastName = lastNameParts.join(" ") || firstName;

//         const payload = {
//           currency: "NGN",
//           customer: {
//             bvn: "22222222222", // NOTE: Still hardcoded BVN (as in your original function)
//             first_name: firstName,
//             last_name: lastName,
//             email: userDetail.email,
//             mobile_no: userProfile.phoneNumber,
//           },
//         };

//         // C. CALL EXTERNAL API
//         const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
//           headers: {
//             "x-api-key": EXTERNAL_API_KEY,
//             "Content-Type": "application/json",
//           },
//         });

//         const accountData = apiResponse.data.data;

//         // Validation of external response
//         if (
//           !accountData ||
//           !accountData.reference ||
//           !accountData.account_number
//         ) {
//           throw new Error("Invalid external account data structure.");
//         }

//         // D. SAVE NEW ACCOUNT
//         const newVirtualAccount = await VirtualAccount.create({
//           user: userId,
//           providerReference: accountData.reference,
//           accountName: accountData.account_name,
//           accountNumber: accountData.account_number,
//           bankName: accountData.bank_name,
//           currency: payload.currency,
//           email: userDetail.email,
//           phoneNumber: userProfile.phoneNumber,
//         });

//         report.successfullyCreated++;
//         report.successfulCreations.push({
//           memberCode: member.memberCode,
//           email: newVirtualAccount.email,
//           accountNumber: newVirtualAccount.accountNumber,
//         });
//         return { status: "created", memberInfo, account: newVirtualAccount };
//       } catch (error) {
//         // Log individual failure
//         const failureDetails = {
//           ...memberInfo,
//           reason:
//             axios.isAxiosError(error) && error.response
//               ? `External API Error: ${error.response.status} - ${
//                   error.response.data.message || "Unknown"
//                 }`
//               : error.message,
//         };
//         report.failedToCreate.push(failureDetails);
//         return { status: "failed", memberInfo, error: failureDetails.reason };
//       }
//     });

//     // Wait for all promises to settle
//     await Promise.allSettled(processingPromises);

//     // 3. --- Final Response and Reporting ---

//     // Log overall result for server-side
//     console.log("Virtual Account Processing Report:", report);

//     return res.status(200).json({
//       message: "Batch processing complete. See details below.",
//       report,
//     });
//   } catch (error) {
//     console.error("Critical Error during batch processing:", error);
//     return res.status(500).json({
//       message:
//         "Internal server error occurred during batch setup or critical stage.",
//       error: error.message,
//       partialReport: report,
//     });
//   }
// };

// import axios from 'axios';
// Assume your models are imported here:
// import { user, clan, UserProfile, VirtualAccount } from '../models';

/**
 * 🚀 Processes virtual account creation for all Nigerian members,
 * now capturing details of skipped members.
 */
export const processAllMemberVirtualAccounts = async (req, res) => {
  const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Your hardcoded clanid

  // Initialize counters and report structure
  const report = {
    totalMembers: 0,
    alreadyExisting: 0,
    successfullyCreated: 0,
    skippedDueToMissingData: 0,
    failedToCreate: [],
    successfulCreations: [],
    // 🚨 NEW ARRAY TO STORE SKIPPED DETAILS
    skippedMembersDetails: [],
  };

  try {
    // 1. --- Core Logic from CaptainCourt__test to get Nigerian members ---

    const clan_Data = await clan.findById(CLAN_ID);
    if (!clan_Data) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Filter members with a phone number (same as CaptainCourt__test)
    const membersWithPhone = clan_Data.members.filter(
      (member) => member.phonenumber && member.phonenumber.trim() !== ""
    );

    // Build combined structure
    const combinedMembers = await Promise.all(
      membersWithPhone.map(async (member) => {
        const userData = await user.findById(member.user).select("email");
        const profileData = await UserProfile.findOne({
          user: member.user,
        }).select("phoneNumber");

        const phone = profileData?.phoneNumber || member.phonenumber || "";
        const formattedPhone = phone.trim();

        return {
          userId: member.user, // Crucial for account creation
          email: userData?.email || null,
          phoneNumber: formattedPhone,
          memberCode: member.memberCode,
        };
      })
    );

    // Keep only Nigerian numbers
    const nigerianMembers = combinedMembers.filter((member) => {
      const phone = member.phoneNumber || "";
      return (
        (phone.startsWith("0") || phone.startsWith("+234")) && member.userId
      );
    });

    report.totalMembers = nigerianMembers.length;

    // 2. --- Account Creation Logic (Adapted from CaptainCourt) ---

    const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
    const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

    // Use Promise.allSettled to run creation concurrently
    const processingPromises = nigerianMembers.map(async (member) => {
      const userId = member.userId;
      const memberInfo = {
        userId,
        email: member.email,
        memberCode: member.memberCode,
      };

      try {
        // A. Check for existing account
        const existingAccount = await VirtualAccount.findOne({ user: userId });
        if (existingAccount) {
          report.alreadyExisting++;
          return { status: "already_exists", memberInfo };
        }

        // B. Fetch detailed user data needed for external API
        const userProfile = await UserProfile.findOne({ user: userId })
          .populate({ path: "user", select: "name email" })
          .select("phoneNumber");

        // 🚨 ENHANCED CHECK: Determine exactly what data is missing
        const missingFields = [];
        if (!userProfile) missingFields.push("UserProfile_Record");
        if (!userProfile?.user) missingFields.push("User_Record");
        if (!userProfile?.phoneNumber)
          missingFields.push("UserProfile_PhoneNumber");
        if (!userProfile?.user?.name) missingFields.push("User_Name");

        // Check if user and required data exist for creation
        if (
          !userProfile ||
          !userProfile.user ||
          !userProfile.phoneNumber ||
          !userProfile.user.name
        ) {
          report.skippedDueToMissingData++;

          // 🚨 PUSH SKIPPED MEMBER DETAILS
          report.skippedMembersDetails.push({
            memberCode: member.memberCode,
            userId: member.userId,
            email: member.email,
            reason: `Missing essential data: [${missingFields.join(", ")}]`,
          });

          return { status: "skipped_missing_data", memberInfo };
        }

        // ... (The rest of the successful creation logic remains the same)
        const userDetail = userProfile.user;
        const [firstName, ...lastNameParts] = userDetail.name.split(" ");
        const lastName = lastNameParts.join(" ") || firstName;

        const payload = {
          currency: "NGN",
          customer: {
            bvn: "22222222222",
            first_name: firstName,
            last_name: lastName,
            email: userDetail.email,
            mobile_no: userProfile.phoneNumber,
          },
        };

        // C. CALL EXTERNAL API
        const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
          headers: {
            "x-api-key": EXTERNAL_API_KEY,
            "Content-Type": "application/json",
          },
        });

        const accountData = apiResponse.data.data;

        // Validation of external response
        if (
          !accountData ||
          !accountData.reference ||
          !accountData.account_number
        ) {
          throw new Error("Invalid external account data structure.");
        }

        // D. SAVE NEW ACCOUNT
        const newVirtualAccount = await VirtualAccount.create({
          user: userId,
          providerReference: accountData.reference,
          accountName: accountData.account_name,
          accountNumber: accountData.account_number,
          bankName: accountData.bank_name,
          currency: payload.currency,
          email: userDetail.email,
          phoneNumber: userProfile.phoneNumber,
        });

        report.successfullyCreated++;
        report.successfulCreations.push({
          memberCode: member.memberCode,
          email: newVirtualAccount.email,
          accountNumber: newVirtualAccount.accountNumber,
        });
        return { status: "created", memberInfo, account: newVirtualAccount };
      } catch (error) {
        // Log individual failure (existing logic)
        const failureDetails = {
          ...memberInfo,
          reason:
            axios.isAxiosError(error) && error.response
              ? `External API Error: ${error.response.status} - ${
                  error.response.data.message || "Unknown"
                }`
              : error.message,
        };
        report.failedToCreate.push(failureDetails);
        return { status: "failed", memberInfo, error: failureDetails.reason };
      }
    });

    // Wait for all promises to settle
    await Promise.allSettled(processingPromises);

    // 3. --- Final Response and Reporting ---

    console.log("Virtual Account Processing Report:", report);

    return res.status(200).json({
      message: "Batch processing complete. See details below.",
      report,
    });
  } catch (error) {
    console.error("Critical Error during batch processing:", error);
    return res.status(500).json({
      message:
        "Internal server error occurred during batch setup or critical stage.",
      error: error.message,
      partialReport: report,
    });
  }
};

// import { user, clan, UserProfile } from '../models'; // Assuming your models are imported correctly
// import mongoose from 'mongoose';

/**
 * 🛠️ Migrates phone numbers from the Clan Member data to the UserProfile
 * for members where the UserProfile is missing this essential piece of data.
 * * @returns {object} A report summarizing the update operation.
 */
export const updateMissingProfilePhoneNumbers = async (req, res) => {
  const CLAN_ID = "6807bbbf6152e3e0bb049580";

  const updateReport = {
    totalMembersChecked: 0,
    updatedProfilesCount: 0,
    skippedAlreadyPresent: 0,
    skippedMissingClanPhone: 0,
    errors: [],
  };

  try {
    const clan_Data = await clan.findById(CLAN_ID).select("members");
    if (!clan_Data) {
      return res.status(404).json({ message: "Clan not found" });
    }

    const members = clan_Data.members;
    updateReport.totalMembersChecked = members.length;

    // Create an array of update promises to run concurrently
    const updatePromises = members.map(async (member) => {
      const userId = member.user;
      const clanPhoneNumber = member.phonenumber
        ? member.phonenumber.trim()
        : null;

      if (!clanPhoneNumber || clanPhoneNumber === "") {
        // Skip if the phone number is missing even in the clan member data
        updateReport.skippedMissingClanPhone++;
        return { userId, status: "skipped_no_clan_phone" };
      }

      try {
        // 1. Find the UserProfile document
        const userProfile = await UserProfile.findOne({ user: userId });

        if (!userProfile) {
          // This should be rare if all users have profiles, but log it just in case
          updateReport.errors.push({
            userId,
            memberCode: member.memberCode,
            reason: "UserProfile record not found.",
          });
          return { userId, status: "error_no_profile" };
        }

        // 2. Check if the profile already has a phone number
        if (userProfile.phoneNumber && userProfile.phoneNumber.trim() !== "") {
          updateReport.skippedAlreadyPresent++;
          return { userId, status: "skipped_already_present" };
        }

        // 3. Update the UserProfile with the clan member's phone number
        userProfile.phoneNumber = clanPhoneNumber;
        await userProfile.save();

        updateReport.updatedProfilesCount++;
        return { userId, status: "updated" };
      } catch (error) {
        // Handle database errors during the find or update operation
        updateReport.errors.push({
          userId,
          memberCode: member.memberCode,
          reason: `DB Error: ${error.message}`,
        });
        return { userId, status: "error_update_failed" };
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // 4. Return the summary report
    return res.status(200).json({
      message:
        "Phone number migration complete. Run the account creation script next.",
      report: updateReport,
    });
  } catch (error) {
    console.error("Critical Error during phone number update:", error);
    return res.status(500).json({
      message: "Internal server error during phone number migration.",
      error: error.message,
      partialReport: updateReport,
    });
  }
};

// Remember to import your models:
// import { user, clan, UserProfile } from '../models';

/**
 * 🕵️ Finds and reports on members who were skipped due to missing
 * phone numbers in the clan member array.
 * @returns {object} A report containing the details of the members to investigate.
 */
export const investigateMissingClanPhoneNumbers = async (req, res) => {
  const CLAN_ID = "6807bbbf6152e3e0bb049580";

  const investigationReport = {
    totalClanMembers: 0,
    membersToInvestigate: [],
    errors: [],
  };

  try {
    // 1. Fetch the Clan data, only selecting the members array
    const clan_Data = await clan.findById(CLAN_ID).select("members");
    if (!clan_Data) {
      return res.status(404).json({ message: "Clan not found" });
    }

    const allMembers = clan_Data.members;
    investigationReport.totalClanMembers = allMembers.length;

    // 2. Identify members who are missing a phone number in the clan member array
    const membersMissingClanPhone = allMembers.filter(
      (member) => !member.phonenumber || member.phonenumber.trim() === ""
    );

    // 3. Gather detailed data for each member to investigate
    const investigationPromises = membersMissingClanPhone.map(
      async (member) => {
        const userId = member.user;

        try {
          // Fetch main User details (name and email)
          const userDetails = await user.findById(userId).select("name email");

          // Fetch full UserProfile details
          const profileDetails = await UserProfile.findOne({ user: userId });

          if (!userDetails || !profileDetails) {
            // Log if a core record is unexpectedly missing
            investigationReport.errors.push({
              memberCode: member.memberCode,
              userId: userId,
              reason: `Missing core record: User (${!userDetails}), Profile (${!profileDetails})`,
            });
            return null; // Skip if user/profile is missing
          }

          // Return a comprehensive object for analysis
          return {
            memberCode: member.memberCode,
            userId: userId,
            // Clan Member Data
            clanMemberDetails: {
              status: member.status,
              homeAddress: member.homeAddress,
              // phone is intentionally null/empty here
            },
            // User Model Data
            user: {
              name: userDetails.name,
              email: userDetails.email,
            },
            // UserProfile Model Data
            profile: {
              phoneNumber: profileDetails.phoneNumber, // Will likely be empty/null
              address: profileDetails.address,
              // Include other profile fields as needed for analysis
            },
          };
        } catch (error) {
          // Handle errors during individual data fetching
          investigationReport.errors.push({
            userId,
            memberCode: member.memberCode,
            reason: `Data Fetch Error: ${error.message}`,
          });
          return null;
        }
      }
    );

    // Wait for all data fetching promises to settle and filter out errors (nulls)
    const results = await Promise.all(investigationPromises);
    investigationReport.membersToInvestigate = results.filter(
      (item) => item !== null
    );

    // 4. Return the comprehensive report
    return res.status(200).json({
      message: `Found ${investigationReport.membersToInvestigate.length} members that are missing phone numbers and need manual data entry or update.`,
      report: investigationReport,
    });
  } catch (error) {
    console.error("Critical Error during investigation:", error);
    return res.status(500).json({
      message: "Internal server error during data investigation.",
      error: error.message,
    });
  }
};

// import axios from "axios";
// Assume your models are imported here:
// import { user, clan, UserProfile, VirtualAccount } from '../models';

/**
 * Helper function to generate a random Nigerian phone number
 * (starting with 080, 081, 070, or 090 and followed by 8 random digits).
 * @returns {string} A 11-digit Nigerian mobile number string.
 */
// const generateRandomNigerianPhoneNumber = () => {
//   const prefixes = ["080", "081", "070", "090"];
//   const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

//   // Generate 8 random digits
//   let randomSuffix = "";
//   for (let i = 0; i < 8; i++) {
//     randomSuffix += Math.floor(Math.random() * 10).toString();
//   }

//   return randomPrefix + randomSuffix;
// };

// export const processAllMemberVirtualAccounts_for_people_without_number = async (
//   req,
//   res
// ) => {
//   const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Your hardcoded clanid

//   // Initialize counters and report structure
//   const report = {
//     totalMembers: 0,
//     alreadyExisting: 0,
//     successfullyCreated: 0,
//     skippedDueToMissingData: 0,
//     failedToCreate: [],
//     successfulCreations: [],
//     skippedMembersDetails: [],
//     // 🚨 New counter for members using a generated phone number
//     createdWithGeneratedPhone: 0,
//   };

//   try {
//     // 1. --- Core Logic from CaptainCourt__test to get Nigerian members ---
//     // NOTE: This initial filtering still relies on phone number being present
//     // in clan.members. If you want to process ALL members regardless of clan
//     // phone, you'd need to remove the first filter. Keeping it for now.

//     const clan_Data = await clan.findById(CLAN_ID);
//     if (!clan_Data) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     // Filter members with a phone number (same as CaptainCourt__test)
//     const membersWithPhone = clan_Data.members.filter(
//       (member) => member.phonenumber && member.phonenumber.trim() !== ""
//     );

//     // Build combined structure
//     const combinedMembers = await Promise.all(
//       membersWithPhone.map(async (member) => {
//         const userData = await user.findById(member.user).select("email");
//         const profileData = await UserProfile.findOne({
//           user: member.user,
//         }).select("phoneNumber");

//         const phone = profileData?.phoneNumber || member.phonenumber || "";
//         const formattedPhone = phone.trim();

//         return {
//           userId: member.user,
//           email: userData?.email || null,
//           phoneNumber: formattedPhone, // This is the *best known* phone number
//           memberCode: member.memberCode,
//         };
//       })
//     );

//     // Keep only Nigerian numbers (this ensures we only process Nigerian-eligible users)
//     const nigerianMembers = combinedMembers.filter((member) => {
//       const phone = member.phoneNumber || "";
//       return (
//         (phone.startsWith("0") || phone.startsWith("+234")) && member.userId
//       );
//     });

//     report.totalMembers = nigerianMembers.length;

//     // 2. --- Account Creation Logic (Adapted from CaptainCourt) ---

//     const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
//     const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

//     // Use Promise.allSettled to run creation concurrently
//     const processingPromises = nigerianMembers.map(async (member) => {
//       const userId = member.userId;
//       const memberInfo = {
//         userId,
//         email: member.email,
//         memberCode: member.memberCode,
//       };

//       let phoneToUse = member.phoneNumber; // Start with the best known number
//       let usedGeneratedPhone = false;

//       try {
//         // A. Check for existing account
//         const existingAccount = await VirtualAccount.findOne({ user: userId });
//         if (existingAccount) {
//           report.alreadyExisting++;
//           return { status: "already_exists", memberInfo };
//         }

//         // B. Fetch detailed user data needed for external API
//         const userProfile = await UserProfile.findOne({ user: userId })
//           .populate({ path: "user", select: "name email" })
//           .select("phoneNumber");

//         // 🚨 ENHANCED CHECK: Determine exactly what data is missing (excluding phone for skipping logic)
//         const missingFields = [];
//         if (!userProfile) missingFields.push("UserProfile_Record");
//         if (!userProfile?.user) missingFields.push("User_Record");
//         if (!userProfile?.user?.name) missingFields.push("User_Name");

//         // Determine if we should SKIP completely (missing Name or User/Profile record)
//         if (!userProfile || !userProfile.user || !userProfile.user.name) {
//           report.skippedDueToMissingData++;

//           // Check if phone was also missing for accurate reporting
//           if (!userProfile?.phoneNumber) {
//             missingFields.push("UserProfile_PhoneNumber");
//           }

//           // PUSH SKIPPED MEMBER DETAILS
//           report.skippedMembersDetails.push({
//             memberCode: member.memberCode,
//             userId: member.userId,
//             email: member.email,
//             reason: `Missing essential data: [${missingFields.join(", ")}]`,
//           });

//           return { status: "skipped_missing_data", memberInfo };
//         }

//         // --- Phone Number Override Logic ---
//         // If the userProfile.phoneNumber is missing, generate one.
//         if (!userProfile.phoneNumber || userProfile.phoneNumber.trim() === "") {
//           phoneToUse = generateRandomNigerianPhoneNumber();
//           usedGeneratedPhone = true;
//           report.createdWithGeneratedPhone++; // Increment the counter
//           console.log(
//             `[Generated Phone] Using ${phoneToUse} for ${member.memberCode}`
//           );
//         } else {
//           // If present, use the one from the profile
//           phoneToUse = userProfile.phoneNumber;
//         }

//         const userDetail = userProfile.user;
//         const [firstName, ...lastNameParts] = userDetail.name.split(" ");
//         const lastName = lastNameParts.join(" ") || firstName;

//         const payload = {
//           currency: "NGN",
//           customer: {
//             bvn: "22222222222",
//             first_name: firstName,
//             last_name: lastName,
//             email: userDetail.email,
//             mobile_no: phoneToUse, // 🚨 Use the determined phone number
//           },
//         };

//         // C. CALL EXTERNAL API
//         const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
//           headers: {
//             "x-api-key": EXTERNAL_API_KEY,
//             "Content-Type": "application/json",
//           },
//         });

//         const accountData = apiResponse.data.data;

//         // Validation of external response
//         if (
//           !accountData ||
//           !accountData.reference ||
//           !accountData.account_number
//         ) {
//           throw new Error("Invalid external account data structure.");
//         }

//         // D. SAVE NEW ACCOUNT
//         const newVirtualAccount = await VirtualAccount.create({
//           user: userId,
//           providerReference: accountData.reference,
//           accountName: accountData.account_name,
//           accountNumber: accountData.account_number,
//           bankName: accountData.bank_name,
//           currency: payload.currency,
//           email: userDetail.email,
//           // 🚨 Store the phone number that was ACTUALLY USED for creation
//           phoneNumber: phoneToUse,
//           wasPhoneGenerated: usedGeneratedPhone, // Optional: flag for records that used the dummy phone
//         });

//         report.successfullyCreated++;
//         report.successfulCreations.push({
//           memberCode: member.memberCode,
//           email: newVirtualAccount.email,
//           accountNumber: newVirtualAccount.accountNumber,
//           phoneUsed: phoneToUse,
//           // Only show the flag if it was a generated number
//           ...(usedGeneratedPhone && { generated: true }),
//         });
//         return { status: "created", memberInfo, account: newVirtualAccount };
//       } catch (error) {
//         // Log individual failure (existing logic)
//         const failureDetails = {
//           ...memberInfo,
//           reason:
//             axios.isAxiosError(error) && error.response
//               ? `External API Error: ${error.response.status} - ${
//                   error.response.data.message || "Unknown"
//                 }`
//               : error.message,
//         };
//         report.failedToCreate.push(failureDetails);
//         return { status: "failed", memberInfo, error: failureDetails.reason };
//       }
//     });

//     // Wait for all promises to settle
//     await Promise.allSettled(processingPromises);

//     // 3. --- Final Response and Reporting ---

//     console.log("Virtual Account Processing Report:", report);

//     return res.status(200).json({
//       message: "Batch processing complete. See details below.",
//       report,
//     });
//   } catch (error) {
//     console.error("Critical Error during batch processing:", error);
//     return res.status(500).json({
//       message:
//         "Internal server error occurred during batch setup or critical stage.",
//       error: error.message,
//       partialReport: report,
//     });
//   }
// };

// import axios from "axios";
// Assume your models are imported here:
// import { user, clan, UserProfile, VirtualAccount } from '../models';

/**
 * Helper function to generate a random Nigerian phone number
 * (starting with 080, 081, 070, or 090 and followed by 8 random digits).
 * @returns {string} A 11-digit Nigerian mobile number string.
 */
// const generateRandomNigerianPhoneNumber = () => {
//   const prefixes = ["080", "081", "070", "090"];
//   const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

//   // Generate 8 random digits
//   let randomSuffix = "";
//   for (let i = 0; i < 8; i++) {
//     randomSuffix += Math.floor(Math.random() * 10).toString();
//   }

//   return randomPrefix + randomSuffix;
// };

// export const processAllMemberVirtualAccounts_for_people_without_number = async (
//   req,
//   res
// ) => {
//   const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Your hardcoded clanid

//   // Initialize counters and report structure
//   const report = {
//     totalMembers: 0,
//     alreadyExisting: 0,
//     successfullyCreated: 0,
//     skippedDueToMissingData: 0,
//     failedToCreate: [],
//     successfulCreations: [],
//     skippedMembersDetails: [],
//     // New counter for members using a generated phone number
//     createdWithGeneratedPhone: 0,
//     // 🚨 New counter for members who failed initially but succeeded on retry
//     succeededOnRetry: 0,
//   };

//   try {
//     // 1. --- Core Logic from CaptainCourt__test to get Nigerian members ---

//     const clan_Data = await clan.findById(CLAN_ID);
//     if (!clan_Data) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     // Filter members with a phone number (same as CaptainCourt__test)
//     const membersWithPhone = clan_Data.members.filter(
//       (member) => member.phonenumber && member.phonenumber.trim() !== ""
//     );

//     // Build combined structure
//     const combinedMembers = await Promise.all(
//       membersWithPhone.map(async (member) => {
//         const userData = await user.findById(member.user).select("email");
//         const profileData = await UserProfile.findOne({
//           user: member.user,
//         }).select("phoneNumber");

//         const phone = profileData?.phoneNumber || member.phonenumber || "";
//         const formattedPhone = phone.trim();

//         return {
//           userId: member.user,
//           email: userData?.email || null,
//           phoneNumber: formattedPhone, // This is the *best known* phone number
//           memberCode: member.memberCode,
//         };
//       })
//     );

//     // Keep only Nigerian numbers
//     const nigerianMembers = combinedMembers.filter((member) => {
//       const phone = member.phoneNumber || "";
//       return (
//         (phone.startsWith("0") || phone.startsWith("+234")) && member.userId
//       );
//     });

//     report.totalMembers = nigerianMembers.length;

//     // 2. --- Account Creation Logic (Adapted from CaptainCourt) ---

//     const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
//     const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

//     // Use Promise.allSettled to run creation concurrently
//     const processingPromises = nigerianMembers.map(async (member) => {
//       const userId = member.userId;
//       const memberInfo = {
//         userId,
//         email: member.email,
//         memberCode: member.memberCode,
//       };

//       // Function to handle the actual API call and saving
//       const createAccountAttempt = async (phone, isGenerated = false) => {
//         // Fetch detailed user data needed for external API
//         const userProfile = await UserProfile.findOne({ user: userId })
//           .populate({ path: "user", select: "name email" })
//           .select("phoneNumber");

//         // --- Skip Check (Ensures we don't proceed without Name/Email) ---
//         if (!userProfile || !userProfile.user || !userProfile.user.name) {
//           const missingFields = [];
//           if (!userProfile) missingFields.push("UserProfile_Record");
//           if (!userProfile?.user) missingFields.push("User_Record");
//           if (!userProfile?.user?.name) missingFields.push("User_Name");
//           if (!userProfile?.phoneNumber)
//             missingFields.push("UserProfile_PhoneNumber");

//           report.skippedDueToMissingData++;
//           report.skippedMembersDetails.push({
//             memberCode: member.memberCode,
//             userId: member.userId,
//             email: member.email,
//             reason: `Missing essential data: [${missingFields.join(", ")}]`,
//           });
//           throw new Error("Skipped: Missing core data");
//         }

//         const userDetail = userProfile.user;
//         const [firstName, ...lastNameParts] = userDetail.name.split(" ");
//         const lastName = lastNameParts.join(" ") || firstName;

//         const payload = {
//           currency: "NGN",
//           customer: {
//             bvn: "22222222222",
//             first_name: firstName,
//             last_name: lastName,
//             email: userDetail.email,
//             mobile_no: phone, // 🚨 Use the provided phone
//           },
//         };

//         const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
//           headers: {
//             "x-api-key": EXTERNAL_API_KEY,
//             "Content-Type": "application/json",
//           },
//         });

//         const accountData = apiResponse.data.data;

//         if (
//           !accountData ||
//           !accountData.reference ||
//           !accountData.account_number
//         ) {
//           throw new Error("Invalid external account data structure.");
//         }

//         // SAVE NEW ACCOUNT
//         const newVirtualAccount = await VirtualAccount.create({
//           user: userId,
//           providerReference: accountData.reference,
//           accountName: accountData.account_name,
//           accountNumber: accountData.account_number,
//           bankName: accountData.bank_name,
//           currency: payload.currency,
//           email: userDetail.email,
//           phoneNumber: phone,
//           wasPhoneGenerated: isGenerated,
//         });

//         report.successfullyCreated++;
//         if (isGenerated) {
//           report.createdWithGeneratedPhone++;
//         }

//         report.successfulCreations.push({
//           memberCode: member.memberCode,
//           email: newVirtualAccount.email,
//           accountNumber: newVirtualAccount.accountNumber,
//           phoneUsed: phone,
//           ...(isGenerated && { generated: true }),
//         });

//         return { status: "created", memberInfo, account: newVirtualAccount };
//       }; // end createAccountAttempt

//       try {
//         // A. Check for existing account
//         const existingAccount = await VirtualAccount.findOne({ user: userId });
//         if (existingAccount) {
//           report.alreadyExisting++;
//           return { status: "already_exists", memberInfo };
//         }

//         // B. Determine phone to use for first attempt
//         const userProfile = await UserProfile.findOne({ user: userId }).select(
//           "phoneNumber"
//         );

//         let phoneToUse = member.phoneNumber;
//         let usedGeneratedPhone = false;

//         // If phone is missing, generate one for the first attempt
//         if (
//           !userProfile?.phoneNumber ||
//           userProfile.phoneNumber.trim() === ""
//         ) {
//           phoneToUse = generateRandomNigerianPhoneNumber();
//           usedGeneratedPhone = true;
//           console.log(
//             `[Generated Phone] Using ${phoneToUse} for ${member.memberCode} (Missing)`
//           );
//         }

//         // First Attempt
//         return await createAccountAttempt(phoneToUse, usedGeneratedPhone);
//       } catch (error) {
//         // --- CATCH BLOCK & RETRY LOGIC ---

//         // 🚨 Check for Invalid Phone Number error (400)
//         const isInvalidPhoneError =
//           axios.isAxiosError(error) &&
//           error.response &&
//           error.response.status === 400 &&
//           (error.response.data.message || "").includes("valid phone number");

//         // 🚨 RETRY
//         if (isInvalidPhoneError) {
//           const retryPhone = generateRandomNigerianPhoneNumber();
//           console.warn(
//             `[Retry Attempt] Invalid phone for ${member.memberCode}. Retrying with generated phone: ${retryPhone}`
//           );

//           try {
//             const result = await createAccountAttempt(retryPhone, true);

//             // If retry succeeds, remove the member from the initial failure list
//             // and track it as a successful retry
//             report.succeededOnRetry++;
//             report.successfullyCreated++;
//             // Note: The success is already logged inside createAccountAttempt
//             return result;
//           } catch (retryError) {
//             // If retry still fails, log the original error details
//             const failureDetails = {
//               ...memberInfo,
//               reason: `Initial failure: Invalid phone. Retry failed: ${retryError.message}`,
//             };
//             report.failedToCreate.push(failureDetails);
//             return {
//               status: "failed",
//               memberInfo,
//               error: failureDetails.reason,
//             };
//           }
//         }

//         // Handle all other errors (missing data, network errors, other API errors)
//         if (error.message.includes("Skipped: Missing core data")) {
//           return { status: "skipped_missing_data", memberInfo };
//         }

//         const failureDetails = {
//           ...memberInfo,
//           reason:
//             axios.isAxiosError(error) && error.response
//               ? `External API Error: ${error.response.status} - ${
//                   error.response.data.message || "Unknown"
//                 }`
//               : error.message,
//         };
//         report.failedToCreate.push(failureDetails);
//         return { status: "failed", memberInfo, error: failureDetails.reason };
//       }
//     });

//     // Wait for all promises to settle
//     await Promise.allSettled(processingPromises);

//     // 3. --- Final Response and Reporting ---

//     console.log("Virtual Account Processing Report:", report);

//     return res.status(200).json({
//       message: "Batch processing complete. See details below.",
//       report,
//     });
//   } catch (error) {
//     console.error("Critical Error during batch processing:", error);
//     return res.status(500).json({
//       message:
//         "Internal server error occurred during batch setup or critical stage.",
//       error: error.message,
//       partialReport: report,
//     });
//   }
// };

// NOTE: You must import the necessary models (Clan, VirtualAccount, User, UserProfile)
// and external dependencies (axios, generateRandomNigerianPhoneNumber)
// as they are used in the function.

// import axios from "axios";
// Assuming these are imported from your models directory:
// import UserProfile from "./models/UserProfile";

// A placeholder for your phone number generation function
// NOTE: Ensure this function exists in your environment!
// const generateRandomNigerianPhoneNumber = () => {
//   // Generates a 10-digit number prefixed with '0'
//   const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();
//   return `080${suffix.substring(0, 8)}`;
// };

// export const processAndGetAllMembersAccounts = async (req, res) => {
//   const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Hardcoded clanid

//   // Report structure for tracking activity
//   const report = {
//     totalMembers: 0,
//     alreadyExisting: 0,
//     newlyCreated: 0,
//     failedToCreate: [],
//     succeededOnRetry: 0,
//   };

//   try {
//     // 1. --- Fetch all members and their existing Virtual Accounts ---

//     const clan = await Clan.findById(CLAN_ID)
//       .populate("members.user", "name email")
//       .populate("admins.user", "name email");

//     if (!clan) {
//       return res.status(404).json({ error: "Clan not found" });
//     }

//     const userIds = clan.members.map((member) => member.user._id);
//     const virtualAccounts = await VirtualAccount.find({
//       user: { $in: userIds },
//     });

//     const virtualAccountMap = new Map();
//     virtualAccounts.forEach((va) => {
//       virtualAccountMap.set(va.user.toString(), va);
//     });

//     // Initial map of members with existing or null accounts
//     let membersWithAccountStatus = clan.members.map((member) => {
//       const userIdString = member.user._id.toString();
//       const isAdmin = clan.admins.find(
//         (admin) => admin.user._id.toString() === userIdString
//       );
//       const existingVirtualAccount = virtualAccountMap.get(userIdString);

//       return {
//         _id: member.user._id,
//         name: member.user.name,
//         email: member.user.email,
//         status: member.status,
//         homeAddress: member.homeAddress,
//         phonenumber: member.phonenumber, // This is the original number
//         memberCode: member.memberCode,
//         flatNumber: member.flatNumber,
//         street: member.street,
//         apartmentType: member.apartmentType,
//         isAdmin: !!isAdmin,
//         adminLevel: isAdmin ? isAdmin.level : null,
//         // Existing account details
//         virtualAccount: existingVirtualAccount
//           ? {
//               providerReference: existingVirtualAccount.providerReference,
//               accountName: existingVirtualAccount.accountName,
//               accountNumber: existingVirtualAccount.accountNumber,
//               bankName: existingVirtualAccount.bankName,
//               currency: existingVirtualAccount.currency,
//             }
//           : null, // This is what we will update
//       };
//     });

//     report.totalMembers = membersWithAccountStatus.length;

//     // 2. --- Process Members WITHOUT a Virtual Account ---

//     const membersToProcess = membersWithAccountStatus.filter(
//       (m) => m.virtualAccount === null
//     );

//     report.alreadyExisting = report.totalMembers - membersToProcess.length;

//     const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
//     const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

//     // Async processing for account creation
//     const creationPromises = membersToProcess.map(async (member) => {
//       const userId = member._id;
//       const memberInfo = {
//         userId,
//         email: member.email,
//         memberCode: member.memberCode,
//       };

//       // Inner function to attempt account creation
//       const createAccountAttempt = async (phone) => {
//         // Fetch detailed user data needed for external API
//         const userProfile = await UserProfile.findOne({ user: userId })
//           .populate({ path: "user", select: "name email" })
//           .select("phoneNumber");

//         // Basic validation before API call
//         if (!userProfile?.user?.name || !userProfile?.user?.email) {
//           throw new Error("Skipped: Missing Name or Email for API call.");
//         }

//         const userDetail = userProfile.user;
//         const [firstName, ...lastNameParts] = userDetail.name.split(" ");
//         const lastName = lastNameParts.join(" ") || firstName;

//         const payload = {
//           currency: "NGN",
//           customer: {
//             bvn: "22222222222",
//             first_name: firstName,
//             last_name: lastName,
//             email: userDetail.email,
//             mobile_no: phone, // ⚠️ Use the generated phone
//           },
//         };

//         const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
//           headers: {
//             "x-api-key": EXTERNAL_API_KEY,
//             "Content-Type": "application/json",
//           },
//         });

//         const accountData = apiResponse.data.data;

//         if (
//           !accountData ||
//           !accountData.reference ||
//           !accountData.account_number
//         ) {
//           throw new Error("Invalid external account data structure.");
//         }

//         // --- SAVE NEW ACCOUNT (Crucial step) ---
//         const newVirtualAccount = await VirtualAccount.create({
//           user: userId,
//           providerReference: accountData.reference,
//           accountName: accountData.account_name,
//           accountNumber: accountData.account_number,
//           bankName: accountData.bank_name,
//           currency: payload.currency,
//           email: userDetail.email,
//           // ⚠️ DO NOT save the generated 'phone' here, only use it for the API call
//           phoneNumber: member.phonenumber || "", // Save original or empty
//         });

//         report.newlyCreated++;
//         return {
//           status: "created",
//           memberId: userId,
//           account: newVirtualAccount,
//         };
//       }; // end createAccountAttempt

//       try {
//         // A. First attempt with a generated phone number
//         const generatedPhone = generateRandomNigerianPhoneNumber();
//         console.log(
//           `[First Attempt] Using generated phone ${generatedPhone} for ${member.memberCode}`
//         );
//         return await createAccountAttempt(generatedPhone);
//       } catch (error) {
//         // --- CATCH BLOCK & RETRY LOGIC ---

//         const isInvalidPhoneError =
//           axios.isAxiosError(error) &&
//           error.response?.status === 400 &&
//           (error.response.data.message || "").includes("valid phone number");

//         // B. RETRY: If it failed due to an invalid phone (even though it was generated,
//         // sometimes the API is strict), retry with a new generated number.
//         if (isInvalidPhoneError) {
//           const retryPhone = generateRandomNigerianPhoneNumber();
//           console.warn(
//             `[Retry Attempt] Invalid phone detected. Retrying with new generated phone: ${retryPhone}`
//           );

//           try {
//             const result = await createAccountAttempt(retryPhone);
//             report.succeededOnRetry++;
//             // Note: report.newlyCreated is incremented inside createAccountAttempt
//             return result;
//           } catch (retryError) {
//             // C. If retry fails, log the original error details
//             const failureDetails = {
//               ...memberInfo,
//               reason: `Initial failure: Invalid phone. Retry failed: ${retryError.message} - ${retryPhone}`,
//             };
//             report.failedToCreate.push(failureDetails);
//             return { status: "failed", memberId: userId };
//           }
//         }

//         // D. Handle all other errors (missing data, network errors, other API errors)
//         const failureDetails = {
//           ...memberInfo,
//           reason:
//             axios.isAxiosError(error) && error.response
//               ? `External API Error: ${error.response.status} - ${
//                   error.response.data.message || "Unknown"
//                 }`
//               : error.message,
//         };
//         report.failedToCreate.push(failureDetails);
//         return { status: "failed", memberId: userId };
//       }
//     });

//     // Wait for all promises to settle
//     const results = await Promise.allSettled(creationPromises);

//     // 3. --- Combine Results and Final Response ---

//     // Map of newly created accounts for quick lookup
//     const newAccountMap = new Map();
//     results.forEach((settledResult) => {
//       if (
//         settledResult.status === "fulfilled" &&
//         settledResult.value.status === "created"
//       ) {
//         const account = settledResult.value.account;
//         newAccountMap.set(account.user.toString(), {
//           providerReference: account.providerReference,
//           accountName: account.accountName,
//           accountNumber: account.accountNumber,
//           bankName: account.bankName,
//           currency: account.currency,
//         });
//       }
//     });

//     // Update the final list with newly created accounts
//     const finalMembersList = membersWithAccountStatus.map((member) => {
//       const newAccount = newAccountMap.get(member._id.toString());
//       if (newAccount) {
//         // Update the member object with the newly created virtual account
//         return {
//           ...member,
//           virtualAccount: newAccount,
//         };
//       }
//       return member;
//     });

//     console.log("Virtual Account Processing & Fetch Report:", report);

//     return res.status(200).json({
//       message: "Members fetched. New virtual accounts created where missing.",
//       members: finalMembersList,
//       report,
//     });
//   } catch (error) {
//     console.error("Critical Error during batch processing:", error);
//     return res.status(500).json({
//       message:
//         "Internal server error occurred during batch setup or critical stage.",
//       error: error.message,
//       partialReport: report,
//     });
//   }
// };

// import clan from "../../models/clan.js";
// import UserProfile from "../../models/profile.js";
// import user from "../../models/user.js";
// import VirtualAccount from "../../models/VirtualAccount.js";
// import { createVirtualAccount } from "../services/bankingAPi.js"; // Not used in the final logic below due to direct axios handling for retry, but kept for context
// import axios from "axios"; // For making API calls

// // A placeholder for your phone number generation function
// NOTE: Ensure this function exists in your environment!
const generateRandomNigerianPhoneNumber = () => {
  // Generates a 10-digit number prefixed with '0'
  const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `080${suffix.substring(0, 8)}`;
};

export const processAndGetAllMembersAccounts = async (req, res) => {
  const CLAN_ID = "6807bbbf6152e3e0bb049580"; // Hardcoded clanid

  // Report structure for tracking activity
  const report = {
    totalMembers: 0,
    alreadyExisting: 0,
    newlyCreated: 0,
    failedToCreate: [],
    succeededOnRetry: 0,
  };

  try {
    // 1. --- Fetch all members and their existing Virtual Accounts ---

    // Using the imported model 'clan'
    const clanData = await clan
      .findById(CLAN_ID)
      .populate("members.user", "name email")
      .populate("admins.user", "name email");

    if (!clanData) {
      return res.status(404).json({ error: "Clan not found" });
    }

    const userIds = clanData.members.map((member) => member.user._id);
    // Using the imported model 'VirtualAccount'
    const virtualAccounts = await VirtualAccount.find({
      user: { $in: userIds },
    });

    const virtualAccountMap = new Map();
    virtualAccounts.forEach((va) => {
      virtualAccountMap.set(va.user.toString(), va);
    });

    // Initial map of members with existing or null accounts
    let membersWithAccountStatus = clanData.members.map((member) => {
      const userIdString = member.user._id.toString();
      const isAdmin = clanData.admins.find(
        (admin) => admin.user._id.toString() === userIdString
      );
      const existingVirtualAccount = virtualAccountMap.get(userIdString);

      return {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        status: member.status,
        homeAddress: member.homeAddress,
        phonenumber: member.phonenumber, // This is the original number
        memberCode: member.memberCode,
        flatNumber: member.flatNumber,
        street: member.street,
        apartmentType: member.apartmentType,
        isAdmin: !!isAdmin,
        adminLevel: isAdmin ? isAdmin.level : null,
        // Existing account details
        virtualAccount: existingVirtualAccount
          ? {
              providerReference: existingVirtualAccount.providerReference,
              accountName: existingVirtualAccount.accountName,
              accountNumber: existingVirtualAccount.accountNumber,
              bankName: existingVirtualAccount.bankName,
              currency: existingVirtualAccount.currency,
            }
          : null, // This is what we will update
      };
    });

    report.totalMembers = membersWithAccountStatus.length;

    // 2. --- Process Members WITHOUT a Virtual Account ---

    const membersToProcess = membersWithAccountStatus.filter(
      (m) => m.virtualAccount === null
    );

    report.alreadyExisting = report.totalMembers - membersToProcess.length;

    const EXTERNAL_BASE_URL = `${process.env.EXTERNAL_BASE_URL}/api/v1/virtual-account`;
    const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

    // Async processing for account creation
    const creationPromises = membersToProcess.map(async (member) => {
      const userId = member._id;
      const memberInfo = {
        userId,
        email: member.email,
        memberCode: member.memberCode,
      };

      // Inner function to attempt account creation
      const createAccountAttempt = async (phone) => {
        // Fetch detailed user data needed for external API, using imported models
        const userProfile = await UserProfile.findOne({ user: userId })
          .populate({ path: "user", select: "name email" }) // populate the 'user' field which is of model 'user'
          .select("phoneNumber");

        // Basic validation before API call
        if (!userProfile?.user?.name || !userProfile?.user?.email) {
          throw new Error("Skipped: Missing Name or Email for API call.");
        }

        const userDetail = userProfile.user;
        const [firstName, ...lastNameParts] = userDetail.name.split(" ");
        const lastName = lastNameParts.join(" ") || firstName;

        const payload = {
          currency: "NGN",
          customer: {
            bvn: "22222222222",
            first_name: firstName,
            last_name: lastName,
            email: userDetail.email,
            mobile_no: phone, // ⚠️ Use the generated phone
          },
        };

        const apiResponse = await axios.post(EXTERNAL_BASE_URL, payload, {
          headers: {
            "x-api-key": EXTERNAL_API_KEY,
            "Content-Type": "application/json",
          },
        });

        const accountData = apiResponse.data.data;

        if (
          !accountData ||
          !accountData.reference ||
          !accountData.account_number
        ) {
          throw new Error("Invalid external account data structure.");
        }

        // --- SAVE NEW ACCOUNT (Crucial step) ---
        // Using the imported model 'VirtualAccount'
        const newVirtualAccount = await VirtualAccount.create({
          user: userId,
          providerReference: accountData.reference,
          accountName: accountData.account_name,
          accountNumber: accountData.account_number,
          bankName: accountData.bank_name,
          currency: payload.currency,
          email: userDetail.email,
          // ⚠️ DO NOT save the generated 'phone' here, save the original or empty string
          phoneNumber: member.phonenumber || "",
        });

        report.newlyCreated++;
        return {
          status: "created",
          memberId: userId,
          account: newVirtualAccount,
        };
      }; // end createAccountAttempt

      try {
        // A. First attempt with a generated phone number
        const generatedPhone = generateRandomNigerianPhoneNumber();
        console.log(
          `[First Attempt] Using generated phone ${generatedPhone} for ${member.memberCode}`
        );
        return await createAccountAttempt(generatedPhone);
      } catch (error) {
        // --- CATCH BLOCK & RETRY LOGIC ---

        const isInvalidPhoneError =
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          (error.response.data.message || "").includes("valid phone number");

        // B. RETRY: If it failed due to an invalid phone, retry with a new generated number.
        if (isInvalidPhoneError) {
          const retryPhone = generateRandomNigerianPhoneNumber();
          console.warn(
            `[Retry Attempt] Invalid phone detected. Retrying with new generated phone: ${retryPhone}`
          );

          try {
            const result = await createAccountAttempt(retryPhone);
            report.succeededOnRetry++;
            return result;
          } catch (retryError) {
            // C. If retry fails, log the original error details
            const failureDetails = {
              ...memberInfo,
              reason: `Initial failure: Invalid phone. Retry failed: ${retryError.message} - ${retryPhone}`,
            };
            report.failedToCreate.push(failureDetails);
            return { status: "failed", memberId: userId };
          }
        }

        // D. Handle all other errors
        const failureDetails = {
          ...memberInfo,
          reason:
            axios.isAxiosError(error) && error.response
              ? `External API Error: ${error.response.status} - ${
                  error.response.data.message || "Unknown"
                }`
              : error.message,
        };
        report.failedToCreate.push(failureDetails);
        return { status: "failed", memberId: userId };
      }
    });

    // Wait for all promises to settle
    const results = await Promise.allSettled(creationPromises);

    // 3. --- Combine Results and Final Response ---

    // Map of newly created accounts for quick lookup
    const newAccountMap = new Map();
    results.forEach((settledResult) => {
      if (
        settledResult.status === "fulfilled" &&
        settledResult.value.status === "created"
      ) {
        const account = settledResult.value.account;
        newAccountMap.set(account.user.toString(), {
          providerReference: account.providerReference,
          accountName: account.accountName,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          currency: account.currency,
        });
      }
    });

    // Update the final list with newly created accounts
    const finalMembersList = membersWithAccountStatus.map((member) => {
      const newAccount = newAccountMap.get(member._id.toString());
      if (newAccount) {
        // Update the member object with the newly created virtual account
        return {
          ...member,
          virtualAccount: newAccount,
        };
      }
      return member;
    });

    console.log("Virtual Account Processing & Fetch Report:", report);

    return res.status(200).json({
      message: "Members fetched. New virtual accounts created where missing.",
      members: finalMembersList,
      report,
    });
  } catch (error) {
    console.error("Critical Error during batch processing:", error);
    return res.status(500).json({
      message:
        "Internal server error occurred during batch setup or critical stage.",
      error: error.message,
      partialReport: report,
    });
  }
};
