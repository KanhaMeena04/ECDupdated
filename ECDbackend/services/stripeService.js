const Stripe = require('stripe');
const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_development';
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("WARNING: STRIPE_SECRET_KEY is not defined in environment variables! Using placeholder.");
}
const stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-06-20', // Upgraded API version to support automatic_payment_methods
});
module.exports = stripe;
