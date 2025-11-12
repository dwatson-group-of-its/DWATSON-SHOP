import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const createPaymentIntent = async ({ amount, currency, paymentMethodId, customerEmail }) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method: paymentMethodId,
    receipt_email: customerEmail,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    receipt_email: paymentIntent.receipt_email,
  };
};

export const capturePayPalOrder = async (orderId) => {
  if (!orderId) {
    throw new Error('PayPal order id is required');
  }

  // Placeholder for actual PayPal capture call.
  // Implement using PayPal REST SDK or HTTP API when client credentials are available.
  return {
    id: orderId,
    status: 'COMPLETED',
    update_time: new Date().toISOString(),
  };
};

