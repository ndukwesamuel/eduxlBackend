import mongoose from "mongoose";
const { Schema } = mongoose;

const clanWithdrawalSchema = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Withdrawal Account Details
    accountDetails: {
      accountName: {
        type: String,
        required: function () {
          return this.isAccountApproved;
        },
      },
      accountNumber: {
        type: String,
        required: function () {
          return this.isAccountApproved;
        },
      },
      bankName: {
        type: String,
        required: function () {
          return this.isAccountApproved;
        },
      },
      bankCode: {
        type: String,
        required: function () {
          return this.isAccountApproved;
        },
      },
      isAccountApproved: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      approvalDate: {
        type: Date,
      },
      lastUpdated: {
        type: Date,
      },
    },
    // Withdrawal Request Details
    withdrawalRequests: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "processed"],
          default: "pending",
        },
        requestDate: {
          type: Date,
          default: Date.now,
        },
        processedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        processDate: {
          type: Date,
        },
        rejectionReason: {
          type: String,
        },
        transactionReference: {
          type: String,
        },
      },
    ],
    // Tracking
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    lastWithdrawalDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
clanWithdrawalSchema.index({ clan: 1, user: 1 }, { unique: true });
clanWithdrawalSchema.index({ "withdrawalRequests.status": 1 });
clanWithdrawalSchema.index({ "accountDetails.isAccountApproved": 1 });

// Virtual for pending withdrawals
clanWithdrawalSchema.virtual("pendingWithdrawals").get(function () {
  return this.withdrawalRequests.filter(
    (req) => req.status === "pending"
  ).length;
});

// Pre-save hook for account updates
clanWithdrawalSchema.pre("save", function (next) {
  if (this.isModified("accountDetails")) {
    this.accountDetails.lastUpdated = new Date();
    // Reset approval if account details change
    if (
      this.isModified("accountDetails.accountName") ||
      this.isModified("accountDetails.accountNumber") ||
      this.isModified("accountDetails.bankName") ||
      this.isModified("accountDetails.bankCode")
    ) {
      this.accountDetails.isAccountApproved = false;
      this.accountDetails.approvedBy = null;
      this.accountDetails.approvalDate = null;
    }
  }
  next();
});

// Method to add new withdrawal request
clanWithdrawalSchema.methods.addWithdrawalRequest = async function (amount) {
  if (!this.accountDetails.isAccountApproved) {
    throw new Error("Withdrawal account not approved");
  }

  this.withdrawalRequests.push({
    amount,
    status: "pending",
  });

  return this.save();
};

// Method to process withdrawal request
clanWithdrawalSchema.methods.processRequest = async function (
  requestId,
  action,
  adminId,
  options = {}
) {
  const request = this.withdrawalRequests.id(requestId);
  if (!request) {
    throw new Error("Withdrawal request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Request has already been processed");
  }

  if (action === "approve") {
    request.status = "approved";
    request.processedBy = adminId;
    request.processDate = new Date();
    this.totalWithdrawn += request.amount;
    this.lastWithdrawalDate = new Date();

    if (options.transactionReference) {
      request.transactionReference = options.transactionReference;
    }
  } else if (action === "reject") {
    request.status = "rejected";
    request.processedBy = adminId;
    request.processDate = new Date();
    request.rejectionReason = options.rejectionReason || "Not specified";
  }

  return this.save();
};

export default mongoose.model("ClanWithdrawal", clanWithdrawalSchema);
