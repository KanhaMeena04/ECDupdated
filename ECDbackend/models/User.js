const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  addressLine: { type: String, default: "" },
  fullAddress: { type: String, default: "" },
  apartment: { type: String, default: "" },
  flatNo: { type: String, default: "" },
  landmark: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zipCode: { type: String, default: "" },
  pincode: { type: String, default: "" },
  phone: { type: String, default: "" },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [Longitude, Latitude]
  },
  deliveryInstructions: { type: String, default: "" },
  isDefault: { type: Boolean, default: false },
});
const paymentMethodSchema = new mongoose.Schema({
  type: { type: String, enum: ["Card", "Wallet", "UPI","COD"], required: true },
  provider: { type: String },
  token: { type: String },
  last4: { type: String },
  isDefault: { type: Boolean, default: false },
});
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "User",
    },
    email: {
      type: String,
      unique: true,
      sparse: true, 
    },
    mobile: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    pin: { type: String },
    password: { type: String },
    role: {
      type: String,
      enum: ["customer", "user", "admin", "restaurant_owner", "rider", "driver"],
      default: "customer",
    },
    roleRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    roleName: {
      type: String,
      default: "",
    },
    permissions: [{
      type: String,
    }],
    profilePic: { type: String },
    avatar: { type: String },
    image: { type: String },
    language: {
      type: String,
      enum: ["en", "de", "ar"],
      default: "en",
    },
    savedAddresses: [addressSchema],
    savedPaymentMethods: [paymentMethodSchema],
    favoriteRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
      },
    ],
    favoriteProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    walletBalance: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, 
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date },
    blockReason: { type: String, default: "" },
    otp: { type: String },
    otpSession: { type: String },
    otpExpires: { type: Date },
    pin: { type: String },
    isVerified: { type: Boolean, default: false },
    pendingProfileUpdate: {
      email: { type: String },
      mobile: { type: String },
      name: { type: String },
      language: { type: String },
      profilePic: { type: String }
    },
    fcmToken: { type: String },
    recentSearches: [{ type: String }],
    codActive: { type: Boolean, default: true },
    isCodBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);
userSchema.pre("save", function (next) {
  if (this.isModified("firstName") || this.isModified("lastName")) {
    const fn = (this.firstName || "").trim();
    const ln = (this.lastName || "").trim();
    if (fn || ln) {
      this.name = `${fn} ${ln}`.trim();
    }
  } else if (this.isModified("name") || !this.firstName || this.firstName === "User") {
    if (this.name && this.name.trim() && this.name !== "User") {
      const parts = this.name.trim().split(" ");
      this.firstName = parts[0] || "";
      this.lastName = parts.slice(1).join(" ") || "";
    }
  }
  if (typeof next === 'function') next();
});

userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ mobile: 1, isDeleted: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "savedAddresses.location": "2dsphere" });
module.exports = mongoose.model("User", userSchema);
