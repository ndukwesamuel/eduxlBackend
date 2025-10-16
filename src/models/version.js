import mongoose from "mongoose";

const VersionSchema = new mongoose.Schema({
  currentVersion: { type: String, required: true },
  minRequiredVersion: { type: String, required: true },
  updateMessage: { type: String, default: null },
  forceUpdate: { type: Boolean, default: false },
});

const Version = mongoose.model("Version", VersionSchema);
export default Version;
