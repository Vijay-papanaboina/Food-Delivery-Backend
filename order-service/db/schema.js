
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // References MenuItem in Restaurant service
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    _id: false, // Disable _id for subdocuments
}, {
    timestamps: false,
});

const orderSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // References Restaurant
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // References User
    deliveryAddress: { type: mongoose.Schema.Types.Mixed, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    status: {
        type: String,
        required: true,
        enum: ["pending", "payment_failed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
        default: "pending",
        index: true,
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["pending", "processing", "paid", "failed", "refunded"],
        default: "pending",
        index: true,
    },
    total: { type: Number, required: true, min: 0 },
    items: [orderItemSchema], // Embedded order items
    confirmedAt: { type: Date },
    deliveredAt: { type: Date },
}, {
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
});

// Virtual property for order ID
orderSchema.virtual('id').get(function() {
  return this._id;
});

export const Order = mongoose.model("Order", orderSchema);
