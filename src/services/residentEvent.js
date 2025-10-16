import User from "../models/profile.js";
import ResidentEvent from "../models/residentEvent.js";

const createNewEvent = async (eventDetails, user, clan) => {
  //   const existingUser = await User.findById(user);
  //   console.log(existingUser);

  //   if (!existingUser) {
  //     throw new Error("User Not Found");
  //   }

  console.log({ eventDetails });
  console.log({ user });
  console.log({ clan });
  return { message: "Good" };
};

const FindEvent = async (user, clan) => {
  const events = await ResidentEvent.find({ clan: clan }).populate("user clan");
  return { message: "Good" };
};

export default {
  createNewEvent,
  FindEvent,
};
