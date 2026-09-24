const Promocode = require('../models/Promocode');
const { getFileUrl } = require('../utils/upload');
const { getPaginationParams, buildSearchQuery } = require('../utils/pagination');
exports.addPromocode = async (req, res) => {
    try {
        const {
            title, description, code,
            restaurant, 
            offerType, discountValue, maxDiscountAmount, minOrderValue, adminContribution,
            usageLimitPerCoupon, usageLimitPerUser,
            availableFrom, expiryDate,
            promoType, paymentMethods,
            isTimeBound, activeDays, timeSlots,
            status
        } = req.body;
        const image = req.file ? getFileUrl(req.file) : req.body.image;
        const existing = await Promocode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: "Promocode with this code already exists" });
        }
        const newPromo = await Promocode.create({
            title, description, 
            code: code.toUpperCase(), 
            image,
            restaurant: restaurant || null,
            offerType, discountValue, maxDiscountAmount, minOrderValue, adminContribution,
            usageLimitPerCoupon, usageLimitPerUser,
            availableFrom, expiryDate,
            promoType, paymentMethods,
            isTimeBound, activeDays, timeSlots,
            status
        });
        res.status(201).json({ message: "Promocode created successfully", data: newPromo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAllPromocodes = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req, 50);
        const search = req.query.search || '';
        const query = buildSearchQuery(search, ['code', 'title', 'description']);
        const total = await Promocode.countDocuments(query);
        const promos = await Promocode.find(query)
            .populate('restaurant', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            promocodes: promos,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPromocodeById = async (req, res) => {
    try {
        const promo = await Promocode.findById(req.params.id)
            .populate('restaurant', 'name');
        if (!promo) {
            return res.status(404).json({ message: "Promocode not found" });
        }
        res.status(200).json(promo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updatePromocode = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = getFileUrl(req.file);
        }
        const updatedPromo = await Promocode.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedPromo) return res.status(404).json({ message: "Promocode not found" });
        res.status(200).json({ message: "Promocode updated", data: updatedPromo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deletePromocode = async (req, res) => {
    try {
        await Promocode.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Promocode deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createOwnerPromocode = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const body = req.body;
        body.restaurant = restaurant._id;
        body.code = body.code ? body.code.toUpperCase() : undefined;
        if (req.file) {
            body.image = getFileUrl(req.file);
        }
        if (body.code) {
            const existing = await Promocode.findOne({ code: body.code });
            if (existing) return res.status(400).json({ message: 'Code already exists' });
        }
        const newPromo = await Promocode.create(body);
        res.status(201).json({ message: 'Promocode created', data: newPromo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getOwnerPromocodes = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const promos = await Promocode.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getOwnerPromocodeById = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const promo = await Promocode.findOne({ _id: req.params.id, restaurant: restaurant._id });
        if (!promo) return res.status(404).json({ message: 'Promocode not found or not yours' });
        res.status(200).json(promo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateOwnerPromocode = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const promo = await Promocode.findOne({ _id: req.params.id, restaurant: restaurant._id });
        if (!promo) return res.status(404).json({ message: 'Promocode not found' });
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = getFileUrl(req.file);
        }
        Object.assign(promo, updateData);
        await promo.save();
        res.status(200).json({ message: 'Promocode updated', data: promo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteOwnerPromocode = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const promo = await Promocode.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
        if (!promo) return res.status(404).json({ message: 'Promocode not found or not yours' });
        res.status(200).json({ message: 'Promocode deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActiveCoupons = async (req, res) => {
  try {
    const { storeId, restaurantId } = req.query;
    const now = new Date();
    const query = {
      status: { $ne: 'inactive' },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } }
      ]
    };

    if (storeId || restaurantId) {
      query.$or.push({ restaurant: storeId || restaurantId }, { restaurant: null });
    }

    const promocodes = await Promocode.find(query).sort({ createdAt: -1 });
    const formatted = promocodes.map(p => ({
      _id: p._id,
      id: p._id,
      code: p.code,
      title: p.title || p.code,
      description: p.description || `Get discount on your order`,
      discount: p.discountValue || 0,
      discountValue: p.discountValue || 0,
      offerType: p.offerType || 'flat',
      maxDiscount: p.maxDiscountAmount || 0,
      minOrder: p.minOrderValue || 0,
      minOrderValue: p.minOrderValue || 0,
      image: p.image || ''
    }));

    return res.status(200).json({
      success: true,
      coupons: formatted,
      data: formatted
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCouponCode = async (req, res) => {
  try {
    const { code, couponCode, storeId, restaurantId, orderAmount, amount } = req.body;
    const targetCode = (code || couponCode || "").toString().trim().toUpperCase();
    const targetAmount = Number(orderAmount || amount || 0);

    if (!targetCode) {
      return res.status(400).json({ success: false, valid: false, message: "Coupon code is required" });
    }

    const promo = await Promocode.findOne({ code: targetCode });
    if (!promo) {
      return res.status(400).json({ success: false, valid: false, message: "Invalid coupon code" });
    }

    if (promo.status === 'inactive') {
      return res.status(400).json({ success: false, valid: false, message: "This coupon is inactive" });
    }

    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, valid: false, message: "Coupon has expired" });
    }

    if (promo.minOrderValue && targetAmount < promo.minOrderValue) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Minimum order amount of ₹${promo.minOrderValue} required for this coupon`
      });
    }

    const targetStore = storeId || restaurantId;
    if (promo.restaurant && targetStore && promo.restaurant.toString() !== targetStore.toString()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Coupon is not applicable for this restaurant"
      });
    }

    let discount = 0;
    if (promo.offerType === 'percentage' || promo.offerType === 'percent') {
      discount = (targetAmount * (promo.discountValue || 0)) / 100;
      if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
        discount = promo.maxDiscountAmount;
      }
    } else {
      discount = promo.discountValue || 0;
    }

    discount = Math.min(discount, targetAmount);

    return res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon ${targetCode} applied successfully!`,
      discountAmount: discount,
      coupon: {
        _id: promo._id,
        id: promo._id,
        code: targetCode,
        discount,
        description: promo.description || ""
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

