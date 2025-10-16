import mongoose from "mongoose";

const connectDB = async (url) => {
  return await mongoose.connect(url, {
    // dbName: "PAUSE-POINT",
    // dbName: "MAIN-PAUSE-POINT",
  });
};

export default connectDB;
