import { handleWebhookService } from "../services/webhook.service.js";

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const body = req.body;

  try {
    const result = await handleWebhookService(body, signature, req.producer);
    res.json(result);
  } catch (error) {
    console.error("Webhook handling error:", error.message);
    // Simple error response for Stripe to retry if needed (400 for signature error)
    if (error.message.startsWith("Webhook Error")) {
        return res.status(400).send(error.message);
    }
    return res.status(500).json({ error: "Failed to process webhook" });
  }
};