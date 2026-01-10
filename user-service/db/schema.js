import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  {
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

// Virtual property for address ID
addressSchema.virtual('id').get(function() {
  return this._id;
});

const cartItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to MenuItem in restaurant-service
    quantity: { type: Number, required: true, min: 1 },
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
  },
);

// Virtual property for cartItem ID
cartItemSchema.virtual('id').get(function() {
  return this._id;
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, unique:true, trim: true },
    role: {
      type: String,
      required: true,
      default: "customer",
      enum: ["customer", "admin", "driver", "restaurant"],
    },
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    cart: [cartItemSchema],
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
  },
);

// Virtual property for user ID
userSchema.virtual('id').get(function() {
  return this._id;
});


// Export only the User model (Address and CartItem are embedded subdocuments)
export const User = mongoose.model("User", userSchema);
export { userSchema };
