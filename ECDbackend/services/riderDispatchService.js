const mongoose = require('mongoose');
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const RideRequest = require('../models/RideRequest');
const Restaurant = require('../models/Restaurant');
const socketService = require('./socketService');
const { sendNotification } = require('../utils/notificationService');
const { calculateDistance, estimateTravelMinutes } = require('../utils/locationUtils');
const { ensureRiderId } = require('../utils/idGenerator');
const SEARCH_RADIUS_KM = 25; // Strictly 25km maximum rider search radius
const BATCH_SIZE = 5;              // How many riders to notify at once
const BATCH_TIMEOUT_MS = 45000;   // 45 seconds for a batch to respond before sending next batch
exports.findAndNotifyRider = async (orderId) => {
    try {
        const targetId = String(orderId?._id || orderId || '').trim();
        const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && targetId.length === 24;
        const orderFilter = isObjectId
          ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
          : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
        const order = await Order.findOne(orderFilter);
        if (!order) return console.error('Order not found for dispatch:', orderId);
        if (order.rider || ['cancelled', 'delivered', 'picked_up'].includes(order.status)) return;
        const allowableDispatchStatuses = ['ready', 'preparing', 'accepted', 'in_kitchen'];
        if (!allowableDispatchStatuses.includes(order.status)) {
            console.log(`[Dispatch] Rider search deferred for Order ${orderId}: Food is currently ${order.status}.`);
            return;
        }
        const restaurant = await Restaurant.findById(order.restaurant);
        const restaurantCoords = restaurant?.location?.coordinates;
        if (!restaurantCoords || !Array.isArray(restaurantCoords) || restaurantCoords.length < 2) {
            return console.error('Restaurant location missing for dispatch');
        }
        const previousRequests = await RideRequest.find({ order: order._id }).select('rider');
        const alreadyNotifiedRiderIds = previousRequests.map(r => r.rider);
        let nearbyRiders = [];
        try {
            const candidateRiders = await Rider.find({
                _id: { $nin: alreadyNotifiedRiderIds },
                isOnline: true,
                verificationStatus: { $ne: 'rejected' },
                currentLocation: {
                    $geoWithin: {
                        $centerSphere: [
                            restaurantCoords,
                            SEARCH_RADIUS_KM / 6378.1
                        ]
                    }
                }
            }).populate('user', 'name mobile');

            nearbyRiders = candidateRiders.filter(rider => {
                const rCoords = rider.currentLocation?.coordinates;
                if (!rCoords || !Array.isArray(rCoords) || rCoords.length < 2 || (rCoords[0] === 0 && rCoords[1] === 0)) {
                    return false;
                }
                const distKm = calculateDistance(rCoords, restaurantCoords);
                return distKm <= SEARCH_RADIUS_KM;
            }).slice(0, BATCH_SIZE);
        } catch (geoErr) {
            console.warn('[Dispatch] Geo query error:', geoErr.message);
        }

        if (nearbyRiders.length === 0) {
            console.log(`[Dispatch] No riders found within ${SEARCH_RADIUS_KM}km for Order ${orderId}`);
            socketService.emitToRestaurant(order.restaurant.toString(), 'order:no_rider_found', {
                orderId,
                message: `No riders available within ${SEARCH_RADIUS_KM} km`
            });
            return;
        }
        console.log(`[Dispatch] Sending batch of ${nearbyRiders.length} riders for Order ${orderId}`);
        const restaurantCoords = restaurant.location?.coordinates || [0, 0];
        const customerCoords = order.deliveryAddress?.coordinates || [0, 0];
        const deliveryDistance = calculateDistance(restaurantCoords, customerCoords);
        const deliveryMinutes = estimateTravelMinutes(deliveryDistance);
        const riderEarning = typeof order.riderEarning === 'number'
            ? order.riderEarning
            : (order.riderCommission || 0) + (order.tip || 0);
        const batchRequests = await Promise.allSettled(
            nearbyRiders.map(rider =>
                RideRequest.create({
                    order: order._id,
                    rider: rider._id,
                    status: 'pending'
                })
            )
        );
        const successfulRequests = [];
        batchRequests.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                successfulRequests.push({ rider: nearbyRiders[i], request: result.value });
            }
        });
        if (successfulRequests.length === 0) {
            console.error(`[Dispatch] Failed to create any RideRequest for Order ${orderId}`);
            return;
        }
        for (const { rider, request } of successfulRequests) {
            const riderCoords = rider.currentLocation?.coordinates || [0, 0];
            const pickupDistance = calculateDistance(riderCoords, restaurantCoords);
            const pickupMinutes = estimateTravelMinutes(pickupDistance);
            const ordNumber = order.orderNumber || (order._id ? `ORD${order._id.toString().slice(-4).toUpperCase()}` : "ORD001");
            const totAmount = Number(order.totalAmount || 0);
            const requestData = {
                requestId: request._id,
                orderId: ordNumber,
                orderNumber: ordNumber,
                backendOrderId: order._id,
                customerId: order.customerId || 'C001',
                restaurantId: order.restaurantId || restaurant.restaurantId || 'RNT001',
                restaurantName: restaurant.name,
                restaurantAddress: restaurant.address,
                earnings: riderEarning,
                riderEarning: riderEarning,
                driverEarnings: riderEarning,
                tip: order.tip || 0,
                totalAmount: totAmount,
                amount: totAmount,
                total: totAmount,
                orderAmount: totAmount,
                payableAmount: Number(order.payableAmount || totAmount),
                collectCashAmount: order.paymentMethod === 'cod' ? totAmount : 0,
                paymentMethod: order.paymentMethod,
                itemTotal: Number(order.itemTotal || 0),
                tax: Number(order.tax || 0),
                packagingFee: Number(order.packagingFee || order.packaging || 0),
                deliveryFee: Number(order.deliveryFee || 0),
                bill: {
                    itemTotal: Number(order.itemTotal || 0),
                    tax: Number(order.tax || 0),
                    packagingFee: Number(order.packagingFee || order.packaging || 0),
                    packaging: Number(order.packagingFee || order.packaging || 0),
                    deliveryFee: Number(order.deliveryFee || 0),
                    deliveryCharge: Number(order.deliveryFee || 0),
                    platformFee: Number(order.platformFee || 0),
                    discount: Number(order.discount || 0),
                    tip: Number(order.tip || 0),
                    totalAmount: totAmount,
                    amount: totAmount,
                    total: totAmount,
                    payableAmount: Number(order.payableAmount || totAmount),
                    toPay: totAmount,
                    riderEarning: riderEarning
                },
                distances: {
                    pickupDistance: Math.round(pickupDistance * 100) / 100,
                    deliveryDistance: Math.round(deliveryDistance * 100) / 100,
                    totalDistance: Math.round((pickupDistance + deliveryDistance) * 100) / 100
                },
                estimatedTime: {
                    pickupMinutes,
                    deliveryMinutes,
                    totalMinutes: pickupMinutes + deliveryMinutes
                },
                batchSize: successfulRequests.length,
                expiresIn: BATCH_TIMEOUT_MS / 1000
            };
            const riderUserId = rider.user?._id ? rider.user._id.toString() : rider.user.toString();
            socketService.emitToRider(riderUserId, 'rider:new_order_request', requestData);
            const restNameStr = typeof restaurant.name === 'object'
                ? (restaurant.name.en || restaurant.name.hi || Object.values(restaurant.name)[0] || 'Restaurant')
                : (restaurant.name || 'Restaurant');
            sendNotification(
                riderUserId,
                '🚀 New Delivery Request!',
                `Earn ₹${riderEarning} — ${restNameStr} → ${order.deliveryAddress?.area || 'Customer'} (Order: ₹${totAmount})`,
                { orderId: order._id.toString(), requestId: request._id.toString(), totalAmount: totAmount, type: 'dispatch_request' }
            ).catch(() => { }); // non-blocking
        }
        setTimeout(async () => {
            await checkBatchTimeout(
                order._id,
                successfulRequests.map(sr => sr.request._id)
            );
        }, BATCH_TIMEOUT_MS);
    } catch (error) {
        console.error('[Dispatch] Error:', error);
    }
};
async function checkBatchTimeout(orderId, requestIds) {
    try {
        await RideRequest.updateMany(
            { _id: { $in: requestIds }, status: 'pending' },
            { $set: { status: 'timeout' } }
        );
        const targetId = String(orderId?._id || orderId || '').trim();
        const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && targetId.length === 24;
        const orderFilter = isObjectId
          ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
          : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
        const order = await Order.findOne(orderFilter).select('rider status');
        if (!order) return;
        if (order.rider || ['cancelled', 'delivered'].includes(order.status)) {
            console.log(`[Dispatch] Batch timed out but order ${orderId} is already handled`);
            return;
        }
        console.log(`[Dispatch] Batch timed out for Order ${orderId} — trying next batch`);
        exports.findAndNotifyRider(orderId); // recurse with next batch
    } catch (err) {
        console.error('[Dispatch] Batch timeout error:', err);
    }
}
exports.handleRiderResponse = async (riderUserId, requestId, action) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const rideRequest = await RideRequest.findById(requestId).populate('order');
        if (!rideRequest) throw new Error('Request not found');
        const rider = await Rider.findOne({ user: riderUserId }).populate('user', 'name mobile');
        if (!rider) throw new Error('Rider profile not found');
        if (rideRequest.rider.toString() !== rider._id.toString()) {
            throw new Error('This request is not assigned to you');
        }
        if (rideRequest.status !== 'pending') {
            throw new Error(
                rideRequest.status === 'timeout'
                    ? 'This request has expired'
                    : 'This request has already been processed'
            );
        }
        if (action === 'accepted') {
            const activeOrder = await Order.findOne({
                rider: rider._id,
                status: { $in: ['assigned', 'accepted_by_rider', 'reached_restaurant', 'arrived_restaurant', 'picked_up', 'delivery_arrived'] }
            }).select('_id status');
            if (activeOrder) {
                rideRequest.status = 'rejected';
                await rideRequest.save({ session });
                await session.commitTransaction();
                session.endSession();
                const err = new Error('RIDER_ALREADY_ASSIGNED');
                err.code = 'RIDER_ALREADY_ASSIGNED';
                err.statusCode = 409;
                throw err;
            }
            const targetOrder = await Order.findOne({
                _id: rideRequest.order._id,
                rider: null
            }).session(session);
            if (!targetOrder) {
                rideRequest.status = 'rejected';
                await rideRequest.save({ session });
                await session.commitTransaction();
                session.endSession();
                throw new Error('ORDER_ALREADY_TAKEN');
            }
            const riderIdCode = await ensureRiderId(rider);
            const oldStatus = targetOrder.status;
            targetOrder.rider = rider._id;
            targetOrder.riderId = riderIdCode;
            targetOrder.status = 'assigned';
            targetOrder.timeline.push({
                status: 'assigned',
                label: 'Rider Assigned',
                description: `Rider ${rider.user.name} has been assigned`,
                by: 'system',
                timestamp: new Date()
            });
            await targetOrder.save({ session });
            rider.isAvailable = false;
            await rider.save({ session });
            rideRequest.status = 'accepted';
            await rideRequest.save({ session });
            await RideRequest.updateMany(
                {
                    rider: rider._id,
                    status: 'pending',
                    order: { $ne: targetOrder._id }
                },
                { $set: { status: 'rejected' } },
                { session }
            );
            await RideRequest.updateMany(
                { order: targetOrder._id, _id: { $ne: rideRequest._id }, status: 'pending' },
                { $set: { status: 'rejected' } },
                { session }
            );
            await session.commitTransaction();
            session.endSession();
            const populatedOrder = await Order.findById(targetOrder._id)
                .populate('customer', 'name customerId')
                .populate('restaurant', 'name restaurantId');
            const ordNumber = targetOrder.orderNumber || (targetOrder._id ? `ORD${targetOrder._id.toString().slice(-4).toUpperCase()}` : "ORD001");
            const updateData = {
                orderId: ordNumber,
                orderNumber: ordNumber,
                backendOrderId: targetOrder._id,
                riderId: riderIdCode,
                customerId: targetOrder.customerId || populatedOrder.customer?.customerId || 'C001',
                restaurantId: targetOrder.restaurantId || populatedOrder.restaurant?.restaurantId || 'RNT001',
                status: 'assigned',
                oldStatus,
                timestamp: new Date(),
                rider: {
                    id: rider._id,
                    riderId: riderIdCode,
                    name: rider.user.name,
                    phone: rider.user.mobile,
                    vehicle: rider.vehicle
                },
                message: `Rider ${rider.user.name} is on the way`
            };
            socketService.emitToOrder(targetOrder._id.toString(), 'order:rider_assigned', {
                orderId: ordNumber,
                orderNumber: ordNumber,
                backendOrderId: targetOrder._id,
                riderId: riderIdCode,
                riderName: rider.user.name || 'Rider',
                riderPhone: rider.user.mobile,
                vehicleNumber: rider.vehicle?.number
            });
            if (targetOrder.customer) {
                const custIdStr = targetOrder.customer.toString();
                socketService.emitToCustomer(custIdStr, 'order:status', updateData);
                socketService.emitToCustomer(custIdStr, 'order:rider_assigned', updateData);
                socketService.emitToUser(custIdStr, 'order:status', updateData);
                socketService.emitToUser(custIdStr, 'order:rider_assigned', updateData);
                sendNotification(
                    targetOrder.customer,
                    "🛵 Delivery Partner Assigned!",
                    `${rider.user.name || 'A delivery partner'} has been assigned to your order #${ordNumber}.`,
                    { orderId: targetOrder._id.toString(), status: 'assigned', type: 'order_status', riderName: rider.user.name }
                ).catch(() => {});
            }
            if (targetOrder.restaurant) {
                socketService.emitToRestaurant(targetOrder.restaurant.toString(), 'order:status', updateData);
                socketService.emitToRestaurant(targetOrder.restaurant.toString(), 'order:rider_assigned', updateData);
            }
            socketService.emitToAdmin('order:rider_assigned', {
                orderId: ordNumber,
                orderNumber: ordNumber,
                backendOrderId: targetOrder._id.toString(),
                riderId: riderIdCode,
                riderName: rider.user.name || 'Rider',
                customerName: populatedOrder.customer?.name,
                customerId: targetOrder.customerId || populatedOrder.customer?.customerId || 'C001',
                restaurantName: populatedOrder.restaurant?.name,
                restaurantId: targetOrder.restaurantId || populatedOrder.restaurant?.restaurantId || 'RNT001',
                orderStatus: 'assigned',
                timestamp: new Date(),
                totalAmount: targetOrder.totalAmount,
                amount: targetOrder.totalAmount,
                riderLocation: rider.currentLocation?.coordinates ? {
                    latitude: rider.currentLocation.coordinates[1],
                    longitude: rider.currentLocation.coordinates[0]
                } : null
            });
            socketService.emitToAdmin('rider:order_accepted', {
                riderId: rider._id.toString(),
                riderUserId: riderUserId.toString(),
                riderName: rider.user.name || 'Rider',
                orderId: targetOrder._id.toString(),
                customerName: populatedOrder.customer?.name,
                restaurantName: populatedOrder.restaurant?.name,
                orderStatus: 'assigned',
                timestamp: new Date(),
                action: 'accepted_order',
                location: rider.currentLocation?.coordinates ? {
                    latitude: rider.currentLocation.coordinates[1],
                    longitude: rider.currentLocation.coordinates[0],
                    type: 'Point'
                } : null,
                lastLocationUpdate: rider.lastLocationUpdateAt || new Date()
            });
            const riderCoords = rider.currentLocation?.coordinates;
            if (riderCoords && riderCoords.length === 2) {
                const [currentLong, currentLat] = riderCoords;
                const eta = targetOrder.deliveryAddress?.coordinates
                    ? estimateTravelMinutes(
                        calculateDistance([currentLong, currentLat], targetOrder.deliveryAddress.coordinates)
                    )
                    : null;
                if (targetOrder.customer) {
                    socketService.emitToCustomer(targetOrder.customer.toString(), 'rider:location_updated', {
                        orderId: targetOrder._id,
                        riderLocation: {
                            lat: currentLat,
                            long: currentLong
                        },
                        eta,
                        timestamp: new Date()
                    });
                }
                socketService.emitToOrder(targetOrder._id.toString(), 'rider:location', {
                    riderId: rider.user?._id?.toString() || riderUserId.toString(),
                    latitude: currentLat,
                    longitude: currentLong,
                    eta,
                    timestamp: new Date()
                });
                socketService.emitToAdmin('rider:location_updated', {
                    riderId: rider._id.toString(),
                    riderName: rider.user?.name || 'Rider',
                    latitude: currentLat,
                    longitude: currentLong,
                    activeOrders: 1,
                    timestamp: new Date()
                });
            }
            const otherPendingRiders = await RideRequest.find({
                order: targetOrder._id,
                _id: { $ne: rideRequest._id },
                status: 'rejected'
            }).select('rider');
            for (const req of otherPendingRiders) {
                const otherRider = await Rider.findById(req.rider).select('user');
                if (otherRider && otherRider.user) {
                    const otherUserId = otherRider.user._id ? otherRider.user._id.toString() : otherRider.user.toString();
                    socketService.emitToRider(otherUserId, 'rider:order_taken', {
                        orderId: targetOrder._id,
                        message: 'This order was accepted by another rider'
                    });
                }
            }
            return { success: true, message: 'Order accepted successfully' };
        } else {
            rideRequest.status = 'rejected';
            await rideRequest.save({ session });
            await session.commitTransaction();
            session.endSession();
            const pendingInBatch = await RideRequest.countDocuments({
                order: rideRequest.order._id,
                status: 'pending'
            });
            if (pendingInBatch === 0) {
                const order = await Order.findById(rideRequest.order._id).select('rider status');
                if (order && !order.rider && !['cancelled', 'delivered'].includes(order.status)) {
                    console.log(`[Dispatch] All riders in batch rejected Order ${rideRequest.order._id} — dispatching next batch`);
                    exports.findAndNotifyRider(rideRequest.order._id);
                }
            }
            return { success: true, message: 'Order rejected' };
        }
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        if (error.message === 'ORDER_ALREADY_TAKEN') {
            const err = new Error('Order already accepted by another rider');
            err.code = 'ORDER_ALREADY_TAKEN';
            err.statusCode = 409;
            throw err;
        }
        throw error;
    }
};
