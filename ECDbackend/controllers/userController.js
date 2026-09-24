const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getFileUrl } = require('../utils/upload');
const { sendOTP } = require('../utils/twilioService');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user || user.isDeleted) {
            return res.status(404).json({ success: false, message: "User not found or account deleted" });
        }
        const userObj = user.toObject ? user.toObject() : { ...user };
        userObj.id = user._id.toString();
        userObj.phone = user.phone || user.mobile || "";
        userObj.mobile = user.mobile || user.phone || "";
        userObj.avatar = user.profilePic || user.avatar || "";
        userObj.profilePic = user.profilePic || user.avatar || "";

        res.status(200).json({
            success: true,
            user: userObj,
            ...userObj
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, mobile, phone, language, avatar } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const newPhone = phone || mobile;
        if (name) user.name = name;
        if (language) user.language = language;
        if (avatar) {
            user.profilePic = avatar;
            user.avatar = avatar;
        }
        if (req.file) {
            const uploadedUrl = await getFileUrl(req.file);
            user.profilePic = uploadedUrl;
            user.avatar = uploadedUrl;
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "Email already in use by another account" });
            }
            user.email = email;
        }

        if (newPhone && newPhone !== user.mobile && newPhone !== user.phone) {
            const clean = newPhone.replace(/[^0-9]/g, '').slice(-10);
            const existingMobile = await User.findOne({
                $or: [{ mobile: `+91${clean}` }, { phone: `+91${clean}` }, { mobile: clean }, { phone: clean }],
                _id: { $ne: user._id }
            });
            if (existingMobile) {
                return res.status(400).json({ success: false, message: "Mobile number already in use by another account" });
            }
            user.mobile = `+91${clean}`;
            user.phone = `+91${clean}`;
        }

        await user.save();

        const userObj = user.toObject ? user.toObject() : { ...user };
        userObj.id = user._id.toString();
        userObj.phone = user.phone || user.mobile || "";
        userObj.mobile = user.mobile || user.phone || "";
        userObj.avatar = user.profilePic || user.avatar || "";
        userObj.profilePic = user.profilePic || user.avatar || "";

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: userObj,
            ...userObj
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyProfileUpdateOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ 
                message: "No pending profile update. Please initiate profile update first." 
            });
        }
        if (user.otpExpires < Date.now()) {
            user.otp = undefined;
            user.otpExpires = undefined;
            user.pendingProfileUpdate = undefined;
            await user.save();
            return res.status(400).json({ 
                message: "OTP expired. Please request a new one." 
            });
        }
        if (otp !== user.otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (user.pendingProfileUpdate) {
            const updates = user.pendingProfileUpdate;
            if (updates.email) user.email = updates.email;
            if (updates.mobile) user.mobile = updates.mobile;
            if (updates.name) user.name = updates.name;
            if (updates.language) user.language = updates.language;
            if (updates.profilePic) user.profilePic = updates.profilePic;
        }
        user.otp = undefined;
        user.otpExpires = undefined;
        user.pendingProfileUpdate = undefined;
        await user.save();
        if (user.email) {
            await Restaurant.updateMany(
                { owner: user._id },
                { $set: { email: user.email } }
            );
        }
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                language: user.language,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.resendProfileUpdateOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.pendingProfileUpdate) {
            return res.status(400).json({ 
                message: "No pending profile update found" 
            });
        }
        const newOtp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.otp = newOtp;
        user.otpExpires = otpExpires;
        await user.save();
        if (updates.mobile) {
            try {
              await sendOTP(updates.mobile, newOtp);
            } catch (smsErr) {
              console.error('Twilio SMS failed (profileUpdate resend mobile):', smsErr.message);
            }
        }
        if (updates.email) {
            console.log(`📧 Resend OTP for email update (${updates.email}) is: ${newOtp}`);
        }
        res.status(200).json({
            message: "OTP resent successfully",
            testOtp: newOtp, // Remove in production
            expiresIn: "5 minutes"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const formatAddress = (a) => {
    if (!a) return null;
    const lat = a.location?.coordinates?.[1] ?? a.latitude ?? 0.0;
    const lng = a.location?.coordinates?.[0] ?? a.longitude ?? 0.0;
    const fullAddr = a.addressLine || a.fullAddress || a.address || "";
    return {
        _id: a._id?.toString() || "",
        id: a._id?.toString() || "",
        label: a.label || "Home",
        fullAddress: fullAddr,
        address: fullAddr,
        addressLine: fullAddr,
        flatNo: a.apartment || a.flatNo || "",
        apartment: a.apartment || a.flatNo || "",
        landmark: a.landmark || "",
        city: a.city || "",
        state: a.state || "",
        pincode: a.zipCode || a.pincode || "",
        zipCode: a.zipCode || a.pincode || "",
        isDefault: a.isDefault === true,
        latitude: lat,
        longitude: lng,
        location: a.location || { type: 'Point', coordinates: [lng, lat] },
        phone: a.phone || ""
    };
};

exports.addAddress = async (req, res) => {
    try {
        const { 
            label, fullAddress, addressLine, address, 
            city, state, pincode, zipCode, 
            flatNo, apartment, landmark, phone,
            latitude, longitude, location, isDefault 
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const resolvedAddressLine = fullAddress || addressLine || address || "";
        const resolvedZip = pincode || zipCode || "";
        const resolvedFlat = flatNo || apartment || "";
        const lat = Number(latitude ?? (location?.coordinates?.[1] ?? 0.0));
        const lng = Number(longitude ?? (location?.coordinates?.[0] ?? 0.0));

        const shouldBeDefault = isDefault === true || !user.savedAddresses || user.savedAddresses.length === 0;

        if (shouldBeDefault && user.savedAddresses) {
            user.savedAddresses.forEach(a => a.isDefault = false);
        }

        const newAddr = {
            label: label || "Home",
            addressLine: resolvedAddressLine,
            city: city || "",
            state: state || "",
            zipCode: resolvedZip,
            apartment: resolvedFlat,
            landmark: landmark || "",
            phone: phone || "",
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            isDefault: shouldBeDefault
        };

        if (!user.savedAddresses) user.savedAddresses = [];
        user.savedAddresses.push(newAddr);
        await user.save();

        const formatted = user.savedAddresses.map(formatAddress);
        res.status(201).json({ 
            success: true, 
            message: "Address added successfully", 
            address: formatAddress(user.savedAddresses[user.savedAddresses.length - 1]),
            addresses: formatted 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('savedAddresses');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const formatted = (user.savedAddresses || []).map(formatAddress);
        res.status(200).json({ success: true, addresses: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const address = user.savedAddresses ? user.savedAddresses.id(req.params.id) : null;
        if (!address) return res.status(404).json({ success: false, message: "Address not found" });

        const updates = req.body;
        if (updates.label) address.label = updates.label;
        if (updates.fullAddress || updates.addressLine || updates.address) {
            address.addressLine = updates.fullAddress || updates.addressLine || updates.address;
        }
        if (updates.city !== undefined) address.city = updates.city;
        if (updates.state !== undefined) address.state = updates.state;
        if (updates.pincode || updates.zipCode) address.zipCode = updates.pincode || updates.zipCode;
        if (updates.flatNo || updates.apartment) address.apartment = updates.flatNo || updates.apartment;
        if (updates.landmark !== undefined) address.landmark = updates.landmark;
        if (updates.phone !== undefined) address.phone = updates.phone;
        if (updates.latitude !== undefined || updates.longitude !== undefined) {
            const lat = Number(updates.latitude ?? address.location?.coordinates?.[1] ?? 0.0);
            const lng = Number(updates.longitude ?? address.location?.coordinates?.[0] ?? 0.0);
            address.location = { type: 'Point', coordinates: [lng, lat] };
        }
        if (updates.isDefault) {
            user.savedAddresses.forEach(a => a.isDefault = false);
            address.isDefault = true;
        }

        await user.save();
        const formatted = user.savedAddresses.map(formatAddress);
        res.status(200).json({ 
            success: true, 
            message: "Address updated successfully", 
            address: formatAddress(address),
            addresses: formatted 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        user.savedAddresses = (user.savedAddresses || []).filter(
            addr => addr._id.toString() !== req.params.id
        );
        await user.save();
        const formatted = user.savedAddresses.map(formatAddress);
        res.status(200).json({ success: true, message: "Address removed", addresses: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const address = user.savedAddresses ? user.savedAddresses.id(req.params.id) : null;
        if (!address) return res.status(404).json({ success: false, message: "Address not found" });

        user.savedAddresses.forEach(a => a.isDefault = false);
        address.isDefault = true;
        await user.save();

        const formatted = user.savedAddresses.map(formatAddress);
        res.status(200).json({ 
            success: true, 
            message: "Default address set successfully", 
            addresses: formatted 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.addPaymentMethod = async (req, res) => {
    try {
        const { type, provider, token, last4, isDefault } = req.body;
        const user = await User.findById(req.user._id);
        if (isDefault) {
            user.savedPaymentMethods.forEach(p => p.isDefault = false);
        }
        user.savedPaymentMethods.push({ type, provider, token, last4, isDefault });
        await user.save();
        res.status(201).json({ message: "Payment method saved", methods: user.savedPaymentMethods });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPaymentMethods = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('savedPaymentMethods');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ methods: user.savedPaymentMethods || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.toggleFavoriteRestaurant = async (req, res) => {
    try {
        const restId = req.params.id;
        if (!isValidObjectId(restId)) {
            return res.status(400).json({ message: "Invalid restaurant id" });
        }
        const restaurant = await Restaurant.findById(restId).select('_id');
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.favoriteRestaurants) user.favoriteRestaurants = [];
        const index = user.favoriteRestaurants.findIndex(
            (id) => id.toString() === restId
        );
        if (index === -1) {
            user.favoriteRestaurants.push(restId);
            await user.save();
            return res.json({ message: "Added to favorites", isFavorite: true });
        }
        user.favoriteRestaurants.splice(index, 1);
        await user.save();
        return res.json({ message: "Removed from favorites", isFavorite: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFavoriteRestaurants = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('favoriteRestaurants')
            .populate('favoriteRestaurants');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({
            favorites: user.favoriteRestaurants || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.toggleFavoriteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }
        const product = await Product.findById(productId).select('_id');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.favoriteProducts) user.favoriteProducts = [];
        const index = user.favoriteProducts.findIndex(
            (id) => id.toString() === productId
        );
        if (index === -1) {
            user.favoriteProducts.push(productId);
            await user.save();
            return res.json({ message: "Added to favorites", isFavorite: true });
        }
        user.favoriteProducts.splice(index, 1);
        await user.save();
        return res.json({ message: "Removed from favorites", isFavorite: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFavoriteProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('favoriteProducts')
            .populate({
                path: 'favoriteProducts',
                populate: { path: 'restaurant', select: '_id name image' }
            });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({
            favorites: user.favoriteProducts || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            isDeleted: true,
            deletedAt: new Date()
        });
        res.status(200).json({ message: "Account successfully deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        const user = await User.findById(req.user._id);
        if (!user || user.isDeleted) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.saveFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken || typeof fcmToken !== 'string') {
            return res.status(400).json({ 
                message: "Valid FCM token is required",
                success: false 
            });
        }
        const user = await User.findById(req.user._id);
        if (!user || user.isDeleted) {
            return res.status(404).json({ 
                message: "User not found",
                success: false 
            });
        }
        const oldToken = user.fcmToken;
        user.fcmToken = fcmToken;
        await user.save();
        console.log(`✅ FCM Token saved for user ${user._id} (${user.name})`);
        if (oldToken && oldToken !== fcmToken) {
            console.log(`   Replaced old token: ${oldToken.substring(0, 20)}...`);
        }
        res.status(200).json({
            success: true,
            message: "Push notification token saved successfully",
            fcmToken: fcmToken.substring(0, 20) + '...' // Return partial token for verification
        });
    } catch (error) {
        console.error('Error saving FCM token:', error.message);
        res.status(500).json({ 
            message: "Failed to save FCM token",
            success: false,
            error: error.message 
        });
    }
};
exports.removeFCMToken = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.isDeleted) {
            return res.status(404).json({ 
                message: "User not found",
                success: false 
            });
        }
        if (!user.fcmToken) {
            return res.status(200).json({
                success: true,
                message: "No FCM token to remove"
            });
        }
        const removedToken = user.fcmToken;
        user.fcmToken = null;
        await user.save();
        console.log(`🗑️ FCM Token removed for user ${user._id} (${user.name})`);
        res.status(200).json({
            success: true,
            message: "Push notification token removed successfully"
        });
    } catch (error) {
        console.error('Error removing FCM token:', error.message);
        res.status(500).json({ 
            message: "Failed to remove FCM token",
            success: false,
            error: error.message 
        });
    }
};
exports.getNotificationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('_id name email fcmToken role');
        if (!user || user.isDeleted) {
            return res.status(404).json({ 
                message: "User not found",
                success: false 
            });
        }
        res.status(200).json({
            success: true,
            notificationStatus: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasFCMToken: !!user.fcmToken,
                fcmTokenPreview: user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : null,
                notificationsEnabled: !!user.fcmToken
            }
        });
    } catch (error) {
        console.error('Error getting notification status:', error.message);
        res.status(500).json({ 
            message: "Failed to get notification status",
            success: false,
            error: error.message 
        });
    }
};
