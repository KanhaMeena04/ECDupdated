const RefundRequest = require('../models/RefundRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../utils/notificationService');
const { getPaginationParams } = require('../utils/pagination');
const { processRefund, applyRestaurantLiabilityToLedger } = require('../services/refundService');

exports.getAllRefundsAdmin = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req, 20);
        const { status, reason } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (reason && reason !== 'all') query.reason = reason;

        const [total, refunds, agg] = await Promise.all([
            RefundRequest.countDocuments(query),
            RefundRequest.find(query)
                .populate('order', 'orderId orderNumber totalAmount paymentMethod paymentStatus status cancellationReason cancellationInitiatedBy createdAt')
                .populate('user', 'name email mobile phone')
                .populate('restaurant', 'name')
                .populate('processedBy', 'name email')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            RefundRequest.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRequests: { $sum: 1 },
                        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        processedCount: { $sum: { $cond: [{ $in: ['$status', ['processed', 'approved']] }, 1, 0] } },
                        rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        totalRefundAmount: {
                            $sum: { $cond: [{ $in: ['$status', ['processed', 'approved']] }, '$refundAmount', 0] }
                        },
                        totalRestaurantLiability: {
                            $sum: { $cond: [{ $in: ['$status', ['processed', 'approved', 'pending']] }, '$restaurantPayableShare', 0] }
                        },
                        totalPlatformLoss: {
                            $sum: { $cond: [{ $in: ['$status', ['processed', 'approved', 'pending']] }, '$platformLoss', 0] }
                        },
                    }
                }
            ])
        ]);

        const summary = agg[0] || {
            totalRequests: 0,
            pendingCount: 0,
            processedCount: 0,
            rejectedCount: 0,
            totalRefundAmount: 0,
            totalRestaurantLiability: 0,
            totalPlatformLoss: 0,
        };

        res.status(200).json({
            success: true,
            refunds,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyRefunds = async (req, res) => {
    try {
        const refunds = await RefundRequest.find({ user: req.user._id }).populate('order').sort({ createdAt: -1 });
        res.status(200).json(refunds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approveRefund = async (req, res) => {
    try {
        const { gatewayTransactionId, note, payoutMethod } = req.body || {};
        const refund = await RefundRequest.findById(req.params.id).populate('order').populate('user');
        if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found' });
        if (refund.status !== 'pending') return res.status(400).json({ success: false, message: 'Refund is not pending' });

        const order = await Order.findById(refund.order?._id || refund.order);
        const user = await User.findById(refund.user?._id || refund.user);
        if (!user || !order) return res.status(404).json({ success: false, message: 'Order or customer not found' });

        const effectiveMethod = payoutMethod || refund.method || 'wallet';
        const amountToProcess = Number(refund.refundAmount || refund.amount || 0);

        if (effectiveMethod !== 'gateway' && order.refund?.status !== 'completed') {
            user.walletBalance = (user.walletBalance || 0) + amountToProcess;
            await user.save();
            await WalletTransaction.create({
                user: user._id,
                amount: amountToProcess,
                type: 'credit',
                description: `Refund (${refund.reason}) for Order #${order.orderNumber || order.orderId || order._id.toString().slice(-6)}`,
                orderId: order._id,
                adminAction: true,
                adminId: req.user._id
            });
        }

        order.refund = {
            ...(order.refund || {}),
            status: 'completed',
            amount: amountToProcess,
            refundedAt: new Date(),
            refundedBy: req.user._id,
            method: effectiveMethod === 'gateway' ? 'gateway' : 'wallet',
            ...(gatewayTransactionId ? { gatewayTransactionId } : {}),
            note: note || refund.note || 'Refund approved by admin'
        };
        order.paymentStatus = 'refunded';
        await order.save();

        refund.method = effectiveMethod === 'gateway' ? 'gateway' : 'wallet';
        refund.status = 'processed';
        refund.approvedBy = req.user._id;
        refund.processedBy = req.user._id;
        refund.processedAt = new Date();
        if (note) refund.note = note;
        await refund.save();

        if ((refund.restaurantPayableShare || 0) > 0 && typeof applyRestaurantLiabilityToLedger === 'function') {
            await applyRestaurantLiabilityToLedger(order, refund.restaurantPayableShare);
        }

        await AuditLog.log({
            entity: 'RefundRequest',
            entityId: refund._id,
            action: 'refund_approved',
            userId: req.user._id,
            userRole: req.user.role || 'admin',
            changes: { oldStatus: 'pending', newStatus: 'processed', amount: amountToProcess, method: refund.method },
            reason: note || `Admin approved ${refund.reason} refund`,
            metadata: { orderId: order._id, gatewayTransactionId: gatewayTransactionId || null }
        }).catch(() => {});

        try {
            await sendNotification(
                user._id,
                'Refund Processed ✅',
                `Your refund of ₹${amountToProcess} for Order #${order.orderNumber || order.orderId || order._id.toString().slice(-6)} has been processed via ${refund.method}.`,
                { orderId: order._id.toString(), targetApp: 'customer', type: 'refund' }
            );
        } catch (e) {}

        res.status(200).json({ success: true, message: 'Refund processed successfully', refund });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.rejectRefund = async (req, res) => {
    try {
        const note = req.body?.note || req.body?.reason || '';
        const refund = await RefundRequest.findById(req.params.id).populate('order').populate('user');
        if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found' });
        if (refund.status !== 'pending') return res.status(400).json({ success: false, message: 'Refund is not pending' });

        refund.status = 'rejected';
        refund.processedBy = req.user._id;
        refund.processedAt = new Date();
        if (note) refund.note = note;
        await refund.save();

        const order = await Order.findById(refund.order?._id || refund.order);
        if (order) {
            order.refund = order.refund || {};
            order.refund.status = 'rejected';
            if (note) order.refund.note = note;
            await order.save();
        }

        await AuditLog.log({
            entity: 'RefundRequest',
            entityId: refund._id,
            action: 'refund_rejected',
            userId: req.user._id,
            userRole: req.user.role || 'admin',
            changes: { oldStatus: 'pending', newStatus: 'rejected' },
            reason: note || 'Rejected by admin',
            metadata: { orderId: order?._id }
        }).catch(() => {});

        try {
            await sendNotification(
                refund.user._id,
                'Refund Request Rejected',
                `Your refund request for Order #${order?.orderNumber || order?.orderId || refund.order._id} was rejected. Reason: ${refund.note || 'N/A'}`,
                { orderId: (order?._id || refund.order._id).toString(), targetApp: 'customer', type: 'refund' }
            );
        } catch (e) {}

        res.status(200).json({ success: true, message: 'Refund rejected', refund });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createManualRefundAdmin = async (req, res) => {
    try {
        const { orderId, reason = 'Manual Admin Refund', customRefundAmount, forceWalletRefund = true } = req.body || {};
        if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

        const order = await Order.findOne({
            $or: [
                ...(orderId.length === 24 ? [{ _id: orderId }] : []),
                { orderId },
                { orderNumber: orderId }
            ]
        });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const result = await processRefund({
            order,
            reason,
            initiatedBy: req.user._id,
            initiatorRole: 'admin',
            customRefundAmount: customRefundAmount !== undefined ? Number(customRefundAmount) : null,
            forceWalletRefund
        });

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error || 'Refund initiation failed' });
        }
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
