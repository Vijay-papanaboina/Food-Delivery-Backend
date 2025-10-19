import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const STRIPE_CONFIG = {
  currency: "usd",
  successUrl: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.FRONTEND_URL}/checkout`,
};
