import mongoose from "mongoose";
const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  {
    _id: false, // Prevents Mongoose from creating an _id for subdocuments (items) if not needed
  }
);

const pickupLocationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    items: [itemSchema], // Array of items using the itemSchema
  },
  {
    _id: false, // Prevents Mongoose from creating an _id for subdocuments (pickupLocations)
  }
);

const errandSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["shopping", "pickup"],
      required: true,
      default: "shopping",
    },
    deliveryAddress: {
      type: String,
      // required: [true, "Please add a delivery address"],
      trim: true,
    },

    pickUpAddress: {
      type: String,
      // required: [true, "Please add a delivery address"],
      trim: true,
    },

    isWithinEstate: {
      type: Boolean,
      required: true,
      default: true, // Default to within estate
    },
    description: {
      type: String,
    },
    pickupTime: {
      type: Date, // Only relevant for pickup-type errands
    },

    // images: [
    //   {
    //     type: String, // e.g. reference images for pickup
    //   },
    // ],

    images: [
      {
        url: { type: String, required: true },
        imagePublicId: { type: String },
        otherdata: { type: Object }, // or Schema.Types.Mixed
      },
    ],

    phoneNumber: {
      type: String,
      required: [true, "Please add a your Phone Number"],
    },
    // Reference to the User who created this errand
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // An errand must be associated with a user
    },
    // Reference to the Clan this errand belongs to
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      // required: false, // An errand must belong to a clan
    },
    pickupLocations: [pickupLocationSchema], // Array of pickup locations
    totalPrice: {
      // This will store the sum of all item prices from all locations
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    serviceCharge: {
      type: Number,
      required: true,
      default: 0, // Setting service charge to 0
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 500, // Default delivery fee of 500
      min: 0,
    },

    totalAmount: {
      // totalPrice + serviceCharge
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "en_route",
        "picked_up",
        "delivered",
        "completed",
        "cancelled",
      ],

      default: "pending",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Pre-save hook to calculate total prices and service charge
// errandSchema.pre("save", function (next) {
//   let calculatedTotalPrice = 0;

//   this.pickupLocations.forEach((location) => {
//     location.items.forEach((item) => {
//       // Ensure quantity and price are numbers before multiplying
//       const quantity = parseFloat(item.quantity) || 0;
//       const price = parseFloat(item.price) || 0;
//       calculatedTotalPrice += quantity * price;
//     });
//   });

//   this.totalPrice = calculatedTotalPrice;
//   // this.serviceCharge = calculatedTotalPrice * 0.1; // 10% service charge

//   this.serviceCharge = 0; // Service charge is now 0
//   this.deliveryFee = 500; // Delivery fee is fixed at 500
//   this.totalAmount = this.totalPrice + this.serviceCharge + this.deliveryFee;

//   next();
// });

// errandSchema.pre("save", function (next) {
//   let calculatedTotalPrice = 0;

//   this.pickupLocations.forEach((location) => {
//     location.items.forEach((item) => {
//       const quantity = parseFloat(item.quantity) || 0;
//       const price = parseFloat(item.price) || 0;
//       calculatedTotalPrice += quantity * price;
//     });
//   });

//   this.totalPrice = calculatedTotalPrice;
//   this.serviceCharge = 0; // Service charge is 0

//   // Set delivery fee based on location
//   this.deliveryFee = this.isWithinEstate ? 500 : 1000;

//   this.totalAmount = this.totalPrice + this.serviceCharge + this.deliveryFee;

// Pre-save hook
errandSchema.pre("save", function (next) {
  if (this.type === "shopping") {
    let calculatedTotalPrice = 0;

    this.pickupLocations.forEach((location) => {
      location.items.forEach((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        calculatedTotalPrice += quantity * price;
      });
    });

    this.totalPrice = calculatedTotalPrice;
  } else {
    // Pickup errands don’t involve items, so totalPrice is always 0
    this.totalPrice = 0;
  }

  this.serviceCharge = 0; // still fixed at 0
  this.deliveryFee = this.isWithinEstate ? 500 : 1000;
  this.totalAmount = this.totalPrice + this.serviceCharge + this.deliveryFee;
  next();
});

// const Errand = mongoose.model("Errand", errandSchema);

// module.exports = Errand; // Use module.exports for CommonJS modules

export default mongoose.model("Errand", errandSchema);
