const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const AdminSetting = require('../models/AdminSetting');
const ScheduledChange = require('../models/ScheduledChange');
const EmergencyControl = require('../models/EmergencyControl');
const FeatureFlag = require('../models/FeatureFlag');
const Restaurant = require('../models/Restaurant');
const RiderEarningConfig = require('../models/RiderEarningConfig');
const AuditLog = require('../models/AuditLog');
const { runAutoReconciliation } = require('./reconciliationService');
const { processRefund } = require('./refundService');
const socketService = require('./socketService');
const mongoose = require('mongoose');

async function executeScheduledChange(change) {
    const payload = change.payload || {};
    if (change.targetEntity === 'AdminSetting') {
        const settings = await AdminSetting.getSettings();
        Object.keys(payload).forEach((key) => {
            if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key]) && settings[key]) {
                Object.assign(settings[key], payload[key]);
            } else {
                settings[key] = payload[key];
            }
        });
        await settings.save();
        return `Updated AdminSetting keys: ${Object.keys(payload).join(', ')}`;
    }
    if (change.targetEntity === 'EmergencyControl') {
        const controls = await EmergencyControl.getControls();
        Object.assign(controls, payload);
        await controls.save();
        return `Updated EmergencyControl keys: ${Object.keys(payload).join(', ')}`;
    }
    if (change.targetEntity === 'FeatureFlag') {
        if (change.targetId) {
            await FeatureFlag.findByIdAndUpdate(change.targetId, { $set: payload });
            return `Updated FeatureFlag ${change.targetId}`;
        }
        if (payload.key) {
            await FeatureFlag.findOneAndUpdate({ key: payload.key }, { $set: payload }, { upsert: true });
            return `Upserted FeatureFlag ${payload.key}`;
        }
    }
    if (change.targetEntity === 'Restaurant' && change.targetId) {
        await Restaurant.findByIdAndUpdate(change.targetId, { $set: payload });
        return `Updated Restaurant ${change.targetId}`;
    }
    if (change.targetEntity === 'RiderEarningConfig') {
        const filter = change.targetId ? { _id: change.targetId } : { isActive: true };
        await RiderEarningConfig.findOneAndUpdate(filter, { $set: payload });
        return `Updated RiderEarningConfig`;
    }
    throw new Error(`Unsupported targetEntity/targetId for ScheduledChange ${change._id}`);
}

const initCronJobs = () => {
    console.log(' Initializing Cron Jobs...');

    // Every 1 minute: Execute due ScheduledChanges
    cron.schedule('* * * * *', async () => {
        if (mongoose.connection.readyState !== 1) return;
        try {
            const dueChanges = await ScheduledChange.find({
                status: 'PENDING',
                scheduledAt: { $lte: new Date() }
            }).limit(20);
            for (const change of dueChanges) {
                try {
                    const logMsg = await executeScheduledChange(change);
                    change.status = 'EXECUTED';
                    change.executedAt = new Date();
                    change.executionLog = logMsg;
                    await change.save();
                    await AuditLog.log({
                        entity: change.targetEntity,
                        entityId: change.targetId || change._id,
                        action: 'scheduled_change_executed',
                        userId: change.createdBy || undefined,
                        userRole: 'system',
                        changes: { payload: change.payload },
                        reason: change.title
                    }).catch(() => {});
                } catch (execErr) {
                    change.status = 'FAILED';
                    change.executionLog = execErr.message;
                    await change.save();
                }
            }
        } catch (err) {
            console.error('[ScheduledChange Cron] Error:', err.message);
        }
    });

    // Every 30 minutes: Automated Payment & Settlement Reconciliation Scanner
    cron.schedule('*/30 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) return;
        try {
            const result = await runAutoReconciliation({ lookbackDays: 7 });
            if (result.mismatchesFound > 0 && socketService.getIO()) {
                socketService.emitToAdmin('admin_alert', {
                    type: 'reconciliation_mismatch',
                    severity: 'warning',
                    title: 'Payment Reconciliation Mismatches Detected',
                    message: `${result.mismatchesFound} new reconciliation mismatch(es) flagged (${result.scannedOrders} orders scanned).`,
                    timestamp: new Date()
                });
            }
        } catch (err) {
            console.error('[Reconciliation Cron] Error:', err.message);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) return;
        try {
            console.log('Running Cleanup Jobs...');
            const now = new Date();
            const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            
            // Job 1: Clean unverified users with expired OTPs
            try {
                console.log('[Cleanup Job 1] Checking for unverified users with expired OTPs...');
                const expiredUsers = await User.find({
                    isVerified: false,
                    otpExpires: { $lt: now }
                });
                if (expiredUsers.length > 0) {
                    const deletedCount = await User.deleteMany({
                        isVerified: false,
                        otpExpires: { $lt: now }
                    });
                    console.log(`✅ Deleted ${deletedCount.deletedCount} unverified users with expired OTPs`);
                } else {
                    console.log('No expired unverified users found.');
                }
            } catch (error) {
                console.error('[Cleanup Job 1] Error:', error.message);
            }

            // Job 2: Clean stale COD / wallet orders older than 20 mins
            try {
                console.log('[Cleanup Job 2] Checking for stale orders...');
                const staleOrders = await Order.find({
                    status: 'placed',
                    paymentMethod: { $in: ['cod', 'wallet'] },
                    createdAt: { $lt: twentyMinsAgo }
                });
                if (staleOrders.length === 0) {
                    console.log('No stale COD/wallet orders found.');
                } else {
                    console.log(`Found ${staleOrders.length} stale COD/wallet orders.`);
                    for (const order of staleOrders) {
                        await Order.updateOne(
                            { _id: order._id },
                            {
                                $set: {
                                    status: 'cancelled',
                                    cancellationReason: 'System Auto-Cancel: Restaurant did not accept in time',
                                    cancellationInitiatedBy: 'system',
                                    cancelledAt: new Date()
                                },
                                $push: {
                                    timeline: {
                                        status: 'cancelled',
                                        timestamp: new Date(),
                                        label: 'Order Cancelled',
                                        by: 'system',
                                        description: 'Restaurant did not accept in time.'
                                    }
                                }
                            }
                        );
                        if (socketService.getIO() && order.customer) {
                            socketService.emitToUser(order.customer.toString(), 'order:status', {
                                orderId: order._id,
                                status: 'cancelled',
                                timestamp: new Date(),
                                message: 'Your order was cancelled as the restaurant did not respond in time.'
                            });
                        }
                    }
                    console.log(`✅ Cleaned up ${staleOrders.length} stale orders.`);
                }
            } catch (error) {
                console.error('[Cleanup Job 2] Error:', error.message);
            }

            // Job 4: Clean expired online payment orders older than 30 mins
            try {
                console.log('[Cleanup Job 4] Checking for expired online payment orders...');
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
                const expiredOnlineOrders = await Order.find({
                    paymentMethod: 'online',
                    paymentStatus: { $in: ['pending', 'processing'] },
                    status: { $in: ['pending', 'placed'] },
                    createdAt: { $lt: thirtyMinsAgo }
                });
                if (expiredOnlineOrders.length === 0) {
                    console.log('No expired online payment orders found.');
                } else {
                    console.log(`Found ${expiredOnlineOrders.length} expired online payment orders.`);
                    for (const order of expiredOnlineOrders) {
                        await Order.updateOne(
                            { _id: order._id },
                            {
                                $set: {
                                    status: 'failed',
                                    paymentStatus: 'failed',
                                    cancellationReason: 'System Auto-Cancel: Online payment not completed in time',
                                    cancellationInitiatedBy: 'system',
                                    cancelledAt: new Date()
                                },
                                $push: {
                                    timeline: {
                                        status: 'failed',
                                        timestamp: new Date(),
                                        label: 'Payment Expired',
                                        by: 'system',
                                        description: 'Payment session expired. Please place a new order.'
                                    }
                                }
                            }
                        );
                        if (socketService.getIO() && order.customer) {
                            socketService.emitToUser(order.customer.toString(), 'order:status', {
                                orderId: order._id,
                                status: 'failed',
                                timestamp: new Date(),
                                message: 'Your payment session expired. Please place a new order.'
                            });
                        }
                    }
                    console.log(`✅ Expired ${expiredOnlineOrders.length} unpaid online orders.`);
                }
            } catch (error) {
                console.error('[Cleanup Job 4] Error:', error.message);
            }

            // Job 3: Clean stale unassigned orders older than 6 hours
            try {
                console.log('[Cleanup Job 3] Checking for stale unassigned orders (6 hours)...');
                const staleUnassignedOrders = await Order.find({
                    status: { $in: ['accepted', 'preparing', 'ready'] },
                    rider: null,
                    orderType: { $nin: ['self_pickup', 'pickup', 'takeaway'] },
                    isSelfPickup: { $ne: true },
                    createdAt: { $lt: sixHoursAgo }
                });
                if (staleUnassignedOrders.length === 0) {
                    console.log('No stale unassigned orders found.');
                } else {
                    console.log(`Found ${staleUnassignedOrders.length} stale unassigned orders.`);
                    for (const order of staleUnassignedOrders) {
                        await Order.updateOne(
                            { _id: order._id },
                            {
                                $set: {
                                    status: 'cancelled',
                                    cancellationReason: 'System Auto-Cancel: No rider assigned after 6 hours',
                                    cancellationInitiatedBy: 'system',
                                    cancelledAt: new Date()
                                },
                                $push: {
                                    timeline: {
                                        status: 'cancelled',
                                        timestamp: new Date(),
                                        label: 'Order Cancelled',
                                        by: 'system',
                                        description: 'No rider assigned after 6 hours.'
                                    }
                                }
                            }
                        );
                        if (socketService.getIO()) {
                            if (order.customer) {
                                socketService.emitToUser(order.customer.toString(), 'order:status', {
                                    orderId: order._id,
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    message: 'Order cancelled due to no rider assignment.'
                                });
                            }
                            if (order.restaurant) {
                                socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
                                    orderId: order._id,
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    message: 'Order cancelled due to no rider assignment.'
                                });
                            }
                        }
                    }
                    console.log(`✅ Cancelled ${staleUnassignedOrders.length} stale unassigned orders.`);
                }
            } catch (error) {
                console.error('[Cleanup Job 3] Error:', error.message);
            }

            // Job 5: Apply Due Date-Based Restaurant Commission Schedules
            try {
                const scheduledRests = await Restaurant.find({
                    'commissionSchedule.applied': false,
                    'commissionSchedule.effectiveDate': { $lte: now }
                });
                for (const rest of scheduledRests) {
                    let changed = false;
                    const dueItems = (rest.commissionSchedule || [])
                        .filter((item) => !item.applied && item.effectiveDate <= now)
                        .sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
                    for (const entry of dueItems) {
                        const oldPct = rest.pricingModel?.commissionPercent ?? rest.commissionPercent ?? 0;
                        rest.pricingModel = rest.pricingModel || {};
                        rest.pricingModel.commissionPercent = entry.commissionPercent;
                        rest.commissionPercent = entry.commissionPercent;
                        rest.commission = entry.commissionPercent;
                        entry.applied = true;
                        entry.appliedAt = new Date();
                        changed = true;
                        await AuditLog.log({
                            entity: 'Restaurant',
                            entityId: rest._id,
                            action: 'commission_schedule_applied',
                            userId: entry.createdBy || undefined,
                            userRole: 'system',
                            changes: { oldCommission: oldPct, newCommission: entry.commissionPercent },
                            reason: entry.note || 'Date-based commission schedule'
                        }).catch(() => {});
                    }
                    if (changed) {
                        await rest.save();
                    }
                }
            } catch (commErr) {
                console.error('[Commission Schedule Job] Error:', commErr.message);
            }

            // Job 6: Configurable Timeout Escalations & Auto-Cancel from AdminSetting.orderTimingConfig
            try {
                const settings = await AdminSetting.getSettings();
                const timing = settings?.orderTimingConfig || {};
                const accMins = Number(timing.restaurantAcceptanceTimeoutMins || 0);
                const prepMins = Number(timing.preparationTimeoutMins || 0);
                const delMins = Number(timing.deliveryTimeoutMins || 0);

                if (accMins > 0) {
                    const accCutoff = new Date(Date.now() - accMins * 60 * 1000);
                    const pendingOrders = await Order.find({
                        status: 'placed',
                        createdAt: { $lt: accCutoff }
                    }).limit(25);
                    for (const ord of pendingOrders) {
                        if (timing.autoCancelOnAcceptanceTimeout) {
                            ord.status = 'cancelled';
                            ord.cancellationReason = `Auto-cancelled: Restaurant did not accept within ${accMins} mins`;
                            ord.cancellationInitiatedBy = 'system';
                            ord.cancelledAt = new Date();
                            ord.timeline.push({
                                status: 'cancelled',
                                timestamp: new Date(),
                                label: 'Acceptance Timeout',
                                by: 'system',
                                description: ord.cancellationReason
                            });
                            await ord.save();
                            if (ord.paymentStatus === 'paid') {
                                await processRefund({
                                    order: ord,
                                    reason: 'Restaurant acceptance timeout',
                                    initiatorRole: 'system'
                                }).catch(() => {});
                            }
                            if (socketService.getIO() && ord.customer) {
                                socketService.emitToUser(ord.customer.toString(), 'order:status', {
                                    orderId: ord._id,
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    message: ord.cancellationReason
                                });
                            }
                        } else if (socketService.getIO()) {
                            socketService.emitToAdmin('admin_alert', {
                                type: 'acceptance_timeout',
                                severity: 'warning',
                                orderId: ord._id,
                                orderNumber: ord.orderNumber,
                                message: `Order #${ord.orderNumber || ord._id} waiting > ${accMins}m for restaurant acceptance`,
                                timestamp: new Date()
                            });
                        }
                    }
                }

                if (prepMins > 0 && socketService.getIO()) {
                    const prepCutoff = new Date(Date.now() - prepMins * 60 * 1000);
                    const delayedPrep = await Order.find({
                        status: { $in: ['accepted', 'preparing'] },
                        updatedAt: { $lt: prepCutoff }
                    }).select('_id orderNumber').limit(20);
                    for (const ord of delayedPrep) {
                        socketService.emitToAdmin('admin_alert', {
                            type: 'preparation_timeout',
                            severity: 'warning',
                            orderId: ord._id,
                            orderNumber: ord.orderNumber,
                            message: `Order #${ord.orderNumber || ord._id} exceeded ${prepMins}m prep threshold`,
                            timestamp: new Date()
                        });
                    }
                }

                if (delMins > 0 && socketService.getIO()) {
                    const delCutoff = new Date(Date.now() - delMins * 60 * 1000);
                    const delayedDelivery = await Order.find({
                        status: { $in: ['picked_up', 'out_for_delivery'] },
                        updatedAt: { $lt: delCutoff }
                    }).select('_id orderNumber').limit(20);
                    for (const ord of delayedDelivery) {
                        socketService.emitToAdmin('admin_alert', {
                            type: 'delivery_timeout',
                            severity: 'critical',
                            orderId: ord._id,
                            orderNumber: ord.orderNumber,
                            message: `Order #${ord.orderNumber || ord._id} exceeded ${delMins}m delivery threshold`,
                            timestamp: new Date()
                        });
                    }
                }
            } catch (timeoutErr) {
                console.error('[Order Timeout Job] Error:', timeoutErr.message);
            }
        } catch (error) {
            console.error('Error in Cron Job:', error);
        }
    });
};

module.exports = initCronJobs;
