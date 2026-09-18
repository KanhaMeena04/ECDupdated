const mongoose = require('mongoose');

const RuleEngineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    conditionField: {
      type: String,
      required: true,
      enum: [
        'orderValue',
        'rainStatus',
        'restaurantAcceptanceTime',
        'cancellationRate',
        'riderDistance',
        'timeOfDay',
        'userOrderCount'
      ]
    },
    operator: {
      type: String,
      required: true,
      enum: ['>', '>=', '<', '<=', '==', '!=', 'contains']
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    actionType: {
      type: String,
      required: true,
      enum: [
        'setDeliveryFee',
        'addDeliveryFee',
        'triggerAdminAlert',
        'issueRestaurantWarning',
        'preventAssignment',
        'applyDiscountPercent',
        'applyDiscountFixed'
      ]
    },
    actionValue: { type: mongoose.Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RuleEngine', RuleEngineSchema);
