import mongoose from "mongoose";

const { Schema } = mongoose;

const domesticstaffSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/002/318/271/original/user-profile-icon-free-vector.jpg",
    },
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    homeAddress: {
      type: String,
      required: true,
    },
    Role: {
      type: String,
      required: true,
    },
    workingHours: {
      type: String,
      required: true,
    },
    staffCode: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Function to generate a unique 6-character alphanumeric code
function generateUniqueStaffCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Pre-save hook to generate a unique staff code
domesticstaffSchema.pre("save", async function (next) {
  if (!this.staffCode) {
    let uniqueCode;
    let isUnique = false;

    // Ensure the generated code is unique by checking the database
    while (!isUnique) {
      uniqueCode = generateUniqueStaffCode();
      const existingStaff = await mongoose.models.DomesticStaff.findOne({
        staffCode: uniqueCode,
      });
      if (!existingStaff) {
        isUnique = true;
      }
    }

    this.staffCode = uniqueCode; // Assign the unique code
  }
  next();
});

export default mongoose.model("DomesticStaff", domesticstaffSchema);
