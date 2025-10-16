export const GetUserCurrentClan = async (req, res) => {
  try {
    const userId = req.user._id;
    const clanData = req.clan;
    return res.status(200).json({
      success: true,
      message: "Current clan set successfully.",
      data: {
        clan: clanData,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("Error setting current clan:", error);
    sendErrorResponse(res, 500, "Failed to set current clan.", error.message);
  }
};
