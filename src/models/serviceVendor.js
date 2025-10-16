// import mongoose from "mongoose";
// const { Schema } = mongoose;
// const { ObjectId } = Schema;

// const serviceVendorSchema = new Schema(
//   {
//     FullName: {
//       type: String,
//       // required: true,
//       trim: true,
//     },
//     // last_name: {
//     //   type: String,
//     //   required: true,
//     //   trim: true,
//     // },
//     about_me: {
//       type: String,
//       // This field is for vendors to give short summary about self. It's optional though.
//     },
//     photo: {
//       url: {
//         type: String,
//       },
//       photoPublicId: {
//         type: String,
//       },
//     },
//     address: {
//       type: String,
//       // required: true,
//       default: "plot 3, Adeshina way, off Lekki express, Lagos.",
//     },
//     gender: {
//       type: String,
//       default: "Male",
//       enum: ["Male", "Female", "Others"],
//     },
//     phone_number: {
//       type: Number,
//       default: "0912345678",
//     },
//     years_of_experience: {
//       type: Number,
//       // required: true,
//     },
//     // category: {
//     //   type: Schema.Types.ObjectId,
//     //   ref: "VendorCategory",
//     //   // required: true,
//     // },
//     // sub_category: {
//     //   type: ObjectId,
//     //   ref: "VendorSubCategory",
//     // },
//     opens: {
//       type: String,

//       // required: true,
//     },
//     closes: {
//       type: Date,
//       // required: true,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     ratings: [
//       {
//         type: Schema.Types.ObjectId,

//         ref: "VendorRating",
//       },
//     ],

//     reviews: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: "Review",
//       },
//     ],
//     avgRating: {
//       type: Number,
//       default: 0,
//     },
//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },
//     servicelikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

//     clan: { type: mongoose.Schema.Types.ObjectId, ref: "Clan" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("ServiceVendor", serviceVendorSchema);

import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const serviceVendorSchema = new Schema(
  {
    // Existing fields remain unchanged
    FullName: {
      type: String,
      trim: true,
    },
    about_me: String,
    photo: {
      url: {
        type: String,
        default:
          "https://deleoye.ng/wp-content/uploads/2016/11/Dummy-image.jpg",
      },
      photoPublicId: {
        type: String,
        default: "default_profile",
      },
    },

    // Modified address field (now supports both old string and new object format)
    address: {
      type: Schema.Types.Mixed, // Allows both String and Object
      default: "plot 3, Adeshina way, off Lekki express, Lagos.",
    },

    // New structured address fields (optional)
    structuredAddress: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "Nigeria" },
      postalCode: String,
      _id: false, // Prevents automatic _id creation for subdocuments
    },

    gender: {
      type: String,
      default: "Male",
      enum: ["Male", "Female", "Others"],
    },

    // // Phone now supports validation
    // phone_number: {
    //   type: String, // Changed from Number to String
    //   default: "0912345678",
    //   validate: {
    //     validator: function (v) {
    //       return /^[0-9]{11}$/.test(v);
    //     },
    //     message: (props) => `${props.value} is not a valid phone number!`,
    //   },
    // },

    // In your ServiceVendor schema
    phone_number: {
      type: String,
      validate: {
        validator: function (v) {
          // Allows: 09123456789 or 2349123456789 or +2349123456789
          return /^(\+?234|0)[789][01]\d{8}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid Nigerian phone number!`,
      },
    },
    // New next of kin fields
    nextOfKin: {
      fullName: String,
      relationship: {
        type: String,
        enum: ["Spouse", "Parent", "Sibling", "Child", "Other"],
      },
      phone: String,
      address: String,
      _id: false,
    },

    // Existing fields remain the same
    years_of_experience: Number,
    opens: String,
    closes: Date,
    isVerified: { type: Boolean, default: false },
    ratings: [{ type: ObjectId, ref: "VendorRating" }],
    reviews: [{ type: ObjectId, ref: "Review" }],
    avgRating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    servicelikes: [{ type: ObjectId, ref: "User" }],
    clan: { type: ObjectId, ref: "Clan" },

    // New generated code field
    userCode: {
      type: String,
      unique: true,
      default: function () {
        const prefix = "SV";
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${year}-${randomNum}`;
      },
    },
  },
  {
    timestamps: true,
    // Make sure virtuals are included in toJSON/toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted address (works with both old and new formats)
serviceVendorSchema.virtual("formattedAddress").get(function () {
  if (typeof this.address === "string") {
    return this.address;
  }
  if (this.structuredAddress) {
    const addr = this.structuredAddress;
    return `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`;
  }
  return "Address not specified";
});

// Migration middleware - runs when documents are loaded
serviceVendorSchema.post("init", function (doc) {
  // Convert old string address to new structured format if needed
  if (typeof doc.address === "string" && !doc.structuredAddress) {
    doc.structuredAddress = {
      street: doc.address,
      city: "",
      state: "",
      country: "Nigeria",
    };
  }

  // Generate userCode if missing
  if (!doc.userCode) {
    doc.userCode = `SV-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }
});

// Ensure phone numbers are properly formatted before saving
serviceVendorSchema.pre("save", function (next) {
  // Format phone numbers by removing non-digit characters
  const formatPhone = (phone) =>
    phone ? phone.toString().replace(/\D/g, "") : null;

  this.phone_number = formatPhone(this.phone_number);

  if (this.nextOfKin?.phone) {
    this.nextOfKin.phone = formatPhone(this.nextOfKin.phone);
  }

  next();
});

export default mongoose.model("ServiceVendor", serviceVendorSchema);
