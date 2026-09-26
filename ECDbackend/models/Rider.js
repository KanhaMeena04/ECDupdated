const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    name: { type: String },
    email: { type: String },
    mobile: { type: String },
    phone: { type: String },
    profilePic: { type: String },
    pin: { type: String },
    associatedRestaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant' // Optional
    },
    address: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    workCity: { type: String, default: "" }, 
    workZone: { type: String, default: "" },
    vehicle: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    documents: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    permanentAddress: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    localAddress: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    emergencyContactNumber: { type: String },
    bankDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    pendingUpdate: {
        email: { type: String },
        mobile: { type: String },
        otp: { type: String },
        otpExpires: { type: Date },
        otpAttempts: { type: Number, default: 0 }
    },
    riderVerified: { type: Boolean, default: false }, 
    isOnline: { type: Boolean, default: false },      
    isAvailable: { type: Boolean, default: false },    
    breakMode: { type: Boolean, default: false },
    breakReason: { type: String },
    sosActive: { type: Boolean, default: false },
    sosLastAt: { type: Date },
    sosLocation: { type: { type: String, default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
    verificationStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'suspended', 'verified'], 
        default: 'pending' 
    },
    rejectionReason: { type: String },
    rejectionDate: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    currentLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [77.0658, 28.2888], index: '2dsphere' } 
    },
    lastLocationUpdateAt: { type: Date },
    rating: { 
        average: { type: Number, default: 4.8, min: 0, max: 5 },
        count: { type: Number, default: 0 },
        breakdown: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        },
        lastRatedAt: { type: Date }
    },
    totalEarnings: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 4.8 }
}, { timestamps: true, strict: false });

riderSchema.index({ "currentLocation": "2dsphere" });
riderSchema.index({ isOnline: 1 });
riderSchema.index({ isAvailable: 1 });
riderSchema.index({ verificationStatus: 1 });
riderSchema.index({ workCity: 1, workZone: 1 });

module.exports = mongoose.model('Rider', riderSchema);
