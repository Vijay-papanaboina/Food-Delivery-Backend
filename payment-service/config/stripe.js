import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const STRIPE_CONFIG = {
  currency: "usd",
  successUrl: `${process.env.CUSTOMER_FRONTEND_URL || process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.CUSTOMER_FRONTEND_URL || process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/checkout`,
};
