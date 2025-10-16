import User from "../../../models/user.js"; // Ensure the User model is imported

export const giveFreeErrands = async (req, res) => {
  try {
    const { amount, email } = req.body; // Get the target amount and email from the request body

    // 1. Validate 'amount' and convert to a number
    // Ensure amount is provided, is a valid non-negative number after conversion.
    const numericAmount = Number(amount); // Explicitly convert to a number
    if (isNaN(numericAmount) || numericAmount < 0) {
      // Now allows 0 free errands
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Amount must be a non-negative number.",
      });
    }

    // 2. Validate 'email'
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to identify the user.",
      });
    }

    // 3. Find the user by email
    const userData = await User.findOne({ email: email });
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided email.",
      });
    }

    // 4. Update the freeErrandsRemaining count by DIRECTLY setting the new amount
    const oldFreeErrands = userData.freeErrandsRemaining; // Store old value for response message
    userData.freeErrandsRemaining = numericAmount; // Directly set the value
    await userData.save(); // Save the updated user document

    // 5. Send a success response
    return res.status(200).json({
      success: true,
      message: `Free errands for user ${email} updated from ${oldFreeErrands} to ${numericAmount}.`,
      userData: {
        _id: userData._id,
        email: userData.email,
        newFreeErrandsRemaining: userData.freeErrandsRemaining,
      },
    });
  } catch (error) {
    console.error("Error giving free errands:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update free errands due to a server error.",
      error: error.message,
    });
  }
};
