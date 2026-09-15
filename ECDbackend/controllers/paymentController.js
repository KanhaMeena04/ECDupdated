const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Promocode = require("../models/Promocode");
const stripe = require("../services/stripeService");
const socketService = require("../services/socketService");
const { logger, logOrderTransition, logPayment, logCouponUsage } = require("../utils/logger");
const { sendNotification } = require("../utils/notificationService");

function resolveCurrencyAndPaymentMethods(order) {
    const addressText = (
        (order.deliveryAddress?.addressLine || "") + " " +
        (order.restaurant?.address || "") + " " +
        (order.restaurant?.city || "")
    ).toLowerCase();

    const isGermany =
        addressText.includes("germany") ||
        addressText.includes("berlin") ||
        addressText.includes("munich") ||
        addressText.includes("frankfurt") ||
        addressText.includes("hamburg");

    const isDubaiOrUAE =
        addressText.includes("dubai") ||
        addressText.includes("uae") ||
        addressText.includes("united arab emirates") ||
        addressText.includes("abu dhabi") ||
        addressText.includes("sharjah");

    if (isGermany) {
        return {
            supported: true,
            region: "germany",
            currency: "eur",
            paymentMethods: ["card", "sepa_debit", "klarna"],
        };
    }

    if (isDubaiOrUAE) {
        return {
            supported: true,
            region: "uae",
            currency: "aed",
            paymentMethods: ["card"],
        };
    }

    return {
        supported: false,
        region: "unsupported",
        currency: null,
        paymentMethods: [],
    };
}

async function markOrderAsPaymentProcessing(order, paymentSourceLabel) {
    order.paymentStatus = "processing";
    if (order.status !== "pending") {
        order.status = "pending";
    }

    order.timeline = order.timeline || [];
    const lastTimeline = order.timeline[order.timeline.length - 1];
    if (!lastTimeline || lastTimeline.status !== "pending" || !lastTimeline.label?.includes("Processing")) {
        order.timeline.push({
            status: "pending",
            timestamp: new Date(),
            label: "Payment Processing",
            by: "system",
            description: `${paymentSourceLabel} initiated. Waiting for Stripe confirmation.`
        });
    }

    await order.save();
}

async function finalizeOrderPaymentSuccess(order, transactionId, sourceLabel) {
    if (!order) return;
    if (order.paymentStatus === "paid") {
        return;
    }

    order.paymentStatus = "paid";
    order.paidAt = new Date();
    order.transactionId = transactionId;
    order.status = "placed";
    order.timeline = order.timeline || [];
    order.timeline.push({
        status: "placed",
        timestamp: new Date(),
        label: "Order Placed",
        by: "system",
        description: "Payment confirmed. Order forwarded to restaurant."
    });
    await order.save();

    try {
        logOrderTransition(order._id, "pending", "placed", order.customer._id, "system", `Payment verified by Stripe webhook (${sourceLabel})`);
        logPayment(null, order.customer._id, "online", order.totalAmount, "success");
    } catch (e) {
        logger.error("Error logging payment transition", e);
    }

    try {
        await Cart.findOneAndDelete({ user: order.customer._id });
    } catch (e) {
        logger.warn("Could not delete cart after payment", { error: e.message, orderId: order._id });
    }

    try {
        if (order.couponCode) {
            await Promocode.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
            logCouponUsage(order.customer._id, order.couponCode, order._id, null, true);
        }
    } catch (e) {
        logger.warn("Could not apply coupon usage after payment", { error: e.message, orderId: order._id });
    }

    try {
        const restaurantId = order.restaurant._id.toString();
        const restaurantOwnerId = order.restaurant.owner?._id || order.restaurant.owner;
        if (restaurantOwnerId) {
            await sendNotification(
                restaurantOwnerId,
                "New Order Received",
                `Order #${order._id.toString().slice(-6)} - ${order.totalAmount} (Online - Paid)`,
                { orderId: order._id, restaurantId }
            );
        }

        const restaurantOrderPayload = {
            orderId: order._id,
            restaurantId,
            customerId: order.customer._id.toString(),
            customerName: order.customer.name,
            restaurantName: order.restaurant.name,
            itemCount: order.items.length,
            amount: order.totalAmount,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: "paid",
            status: "placed",
            timestamp: new Date(),
        };

        socketService.emitToRestaurant(restaurantId, "order:new", restaurantOrderPayload);
        socketService.emitToRestaurant(restaurantId, "restaurant:new_order", restaurantOrderPayload);
        socketService.emitToCustomer(order.customer._id.toString(), "order:status", {
            orderId: order._id,
            status: "placed",
            paymentStatus: "paid",
            message: "Payment confirmed. Your order has been sent to the restaurant.",
            timestamp: new Date(),
        });
        socketService.emitToAdmin("order:new", {
            orderIds: [order._id],
            customerName: order.customer.name,
            restaurantCount: 1,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            timestamp: new Date(),
        });
    } catch (e) {
        logger.error("Failed to notify restaurant on webhook ping", e);
    }
}

async function finalizeOrderPaymentFailure(order, sourceLabel) {
    if (!order || order.paymentStatus === "paid") return;

    order.paymentStatus = "failed";
    order.status = "failed";
    order.cancellationInitiatedBy = "system";
    order.cancelledAt = new Date();
    order.timeline = order.timeline || [];
    order.timeline.push({
        status: "failed",
        timestamp: new Date(),
        label: "Payment Failed",
        by: "system",
        description: `Stripe payment failed (${sourceLabel}).`
    });
    await order.save();

    try {
        socketService.emitToCustomer(order.customer.toString(), "order:status", {
            orderId: order._id,
            status: "failed",
            message: "Your payment failed. Please try placing a new order.",
            timestamp: new Date(),
        });
    } catch (e) {
    }

    try {
        logOrderTransition(order._id, null, "failed", order.customer, "system", `Stripe payment failed (${sourceLabel})`);
        logPayment(null, order.customer, "online", order.totalAmount, "failed");
    } catch (e) {
    }
}

exports.createCheckoutSession = async (req, res) => {
    try {
        const { orderId, successUrl, cancelUrl } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }
        const order = await Order.findById(orderId).populate("restaurant", "name owner");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access to order" });
        }
        if (order.paymentStatus === "paid" || order.paymentStatus === "completed") {
            return res.status(400).json({ success: false, message: "Order is already paid" });
        }
        if (order.status === "failed" || order.status === "cancelled") {
            return res.status(400).json({ success: false, message: `Order is no longer active (${order.status})` });
        }
        if (order.paymentMethod !== "online") {
            return res.status(400).json({ success: false, message: "Order payment method is not 'online'" });
        }
        const { supported, currency, paymentMethods } = resolveCurrencyAndPaymentMethods(order);
        if (!supported) {
            return res.status(400).json({
                success: false,
                message: "Online payments are available only in Germany and Dubai/UAE.",
            });
        }
        const totalAmountInSmallestUnit = Math.round(order.totalAmount * 100);
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
        const finalSuccessUrl = successUrl || `${frontendUrl}/payment-success?order_id=${order._id}`;
        const finalCancelUrl = cancelUrl || `${frontendUrl}/payment-cancel?order_id=${order._id}`;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods,
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `Order #${order._id.toString().slice(-6)} from ${order.restaurant.name || 'Restaurant'}`,
                            description: `${order.items.length} item${order.items.length > 1 ? 's' : ''}`,
                        },
                        unit_amount: totalAmountInSmallestUnit,
                    },
                    quantity: 1,
                },
            ],
            success_url: finalSuccessUrl,
            cancel_url: finalCancelUrl,
            metadata: {
                orderId: order._id.toString(),
                customerId: order.customer.toString(),
            },
            payment_intent_data: {
                metadata: {
                    orderId: order._id.toString(),
                    customerId: order.customer.toString(),
                }
            }
        });

        order.stripeSessionId = session.id;
        await markOrderAsPaymentProcessing(order, "Checkout Session");

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error("Create Checkout Session Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPaymentIntentForMobile = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const order = await Order.findById(orderId).populate("restaurant", "name owner");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access to order" });
        }
        if (order.paymentStatus === "paid" || order.paymentStatus === "completed") {
            return res.status(400).json({ success: false, message: "Order is already paid" });
        }
        if (order.status === "failed" || order.status === "cancelled") {
            return res.status(400).json({ success: false, message: `Order is no longer active (${order.status})` });
        }
        if (order.paymentMethod !== "online") {
            return res.status(400).json({ success: false, message: "Order payment method is not 'online'" });
        }

        const { supported, currency } = resolveCurrencyAndPaymentMethods(order);
        if (!supported) {
            return res.status(400).json({
                success: false,
                message: "Online payments are available only in Germany and Dubai/UAE.",
            });
        }
        const amount = Math.round(order.totalAmount * 100);

        if (order.stripePaymentIntentId) {
            const existingIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
            if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(existingIntent.status)) {
                await markOrderAsPaymentProcessing(order, "Mobile PaymentIntent");
                return res.status(200).json({
                    success: true,
                    orderId: order._id,
                    paymentIntentId: existingIntent.id,
                    clientSecret: existingIntent.client_secret,
                    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
                    currency,
                    amount,
                });
            }
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderId: order._id.toString(),
                customerId: order.customer.toString(),
            },
            description: `Order #${order._id.toString().slice(-6)} from ${order.restaurant?.name || "Restaurant"}`,
        });

        order.stripePaymentIntentId = paymentIntent.id;
        await markOrderAsPaymentProcessing(order, "Mobile PaymentIntent");

        return res.status(200).json({
            success: true,
            orderId: order._id,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            currency,
            amount,
        });
    } catch (error) {
        console.error("Create PaymentIntent Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return res.status(500).send("Stripe webhook secret is not configured");
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                await handlePaymentSuccess(session);
                break;
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
                const session = event.data.object;
                await handlePaymentFailure(session);
                break;
            }
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                await handlePaymentIntentSuccess(paymentIntent);
                break;
            }
            case "payment_intent.payment_failed":
            case "payment_intent.canceled": {
                const paymentIntent = event.data.object;
                await handlePaymentIntentFailure(paymentIntent);
                break;
            }
            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
        res.status(200).send("Event received");
    } catch (error) {
        console.error("Error processing webhook event:", error);
        res.status(500).send("Webhook processing failed");
    }
};
async function handlePaymentSuccess(session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await Order.findById(orderId)
        .populate("customer", "name _id")
        .populate("restaurant", "name _id owner");

    if (!order) {
        console.error(`Webhook: Order ${orderId} not found.`);
        return;
    }

    if (session.payment_intent) {
        order.stripePaymentIntentId = session.payment_intent;
    }
    await finalizeOrderPaymentSuccess(order, session.payment_intent, "Checkout Session");
}

async function handlePaymentFailure(session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    await finalizeOrderPaymentFailure(order, "Checkout Session");
}

async function handlePaymentIntentSuccess(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    let order = null;

    if (orderId) {
        order = await Order.findById(orderId)
            .populate("customer", "name _id")
            .populate("restaurant", "name _id owner");
    }
    if (!order) {
        order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id })
            .populate("customer", "name _id")
            .populate("restaurant", "name _id owner");
    }
    if (!order) {
        console.error(`Webhook: Order not found for payment intent ${paymentIntent.id}`);
        return;
    }

    order.stripePaymentIntentId = paymentIntent.id;
    await finalizeOrderPaymentSuccess(order, paymentIntent.id, "PaymentIntent");
}

async function handlePaymentIntentFailure(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    let order = null;

    if (orderId) {
        order = await Order.findById(orderId);
    }
    if (!order) {
        order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
    }
    if (!order) return;

    await finalizeOrderPaymentFailure(order, "PaymentIntent");
}
