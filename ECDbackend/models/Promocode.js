const mongoose = require('mongoose');

const promocodeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true 
    },
    image: { type: String },
    restaurant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurant', 
        default: null
    },
    offerType: { 
        type: String, 
        enum: ['percent', 'amount', 'free_delivery'], 
        required: true 
    },
    discountValue: { type: Number, required: true },
    maxDiscountAmount: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    fundingSource: {
        type: String,
        enum: ['ECDKART', 'RESTAURANT', 'SHARED'],
        default: 'ECDKART'
    },
    restaurantSharePercent: { type: Number, default: 0 },
    adminSharePercent: { type: Number, default: 100 },
    adminContribution: { type: Number, default: 0 }, 
    usageLimitPerCoupon: { type: Number, default: 0 },
    usageLimitPerUser: { type: Number, default: 1 },
    availableFrom: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    promoType: { type: String, default: 'general' },
    paymentMethods: { 
        type: [String],
        default: ['all'] 
    },
    isTimeBound: { type: Boolean, default: false },
    activeDays: {
        type: [String],
        default: []
    },
    timeSlots: [{
        startTime: String,
        endTime: String
    }],
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Promocode', promocodeSchema);
