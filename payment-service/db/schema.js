import mongoose from "mongoose";

const paymentStatusEnum = ["pending", "processing", "success", "failed", "refunded"];
const paymentMethodEnum = ["card", "wallet", "bank_transfer"];

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // References Order
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      required: true,
      enum: paymentMethodEnum,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // References User
    status: {
      type: String,
      required: true,
      enum: paymentStatusEnum,
      default: "pending",
      index: true,
    },
    transactionId: { type: String },
    failureReason: { type: String },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        delete ret._id;
      }
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        delete ret._id;
      }
    }
  }
);

// Virtual property for payment ID
paymentSchema.virtual('id').get(function() {
  return this._id;
});

export const Payment = mongoose.model("Payment", paymentSchema);
