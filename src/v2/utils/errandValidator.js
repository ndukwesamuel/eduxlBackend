import User from "../../models/user.js";

export const validateErrandData = async (data, userId) => {
  const { title, pickupLocations } = data;

  if (!title?.trim()) {
    return "Title is required";
  }

  if (!pickupLocations?.length) {
    return "At least one pickup location is required";
  }

  // Validate user is resident
  //   const user = await User.findById(userId).populate("clans");
  //   console.log(user);
  //   if (!user?.clans?.length) {
  //     return "User must be a resident of an estate";
  //   }

  return null;
};
