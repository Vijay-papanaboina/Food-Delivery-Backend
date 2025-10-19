// Test script to manually trigger webhook for testing
import fetch from "node-fetch";

const testWebhook = async () => {
  const webhookUrl = "http://localhost:5002/api/webhooks/stripe";

  // Mock Stripe webhook payload for checkout.session.completed
  const mockWebhookPayload = {
    id: "evt_test_webhook",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1234567890",
        object: "checkout.session",
        amount_total: 1599, // $15.99 in cents
        metadata: {
          orderId: "YOUR_ORDER_ID_HERE", // Replace with actual order ID
          userId: "550e8400-e29b-41d4-a716-446655440010",
        },
        payment_status: "paid",
        status: "complete",
      },
    },
  };

  try {
    console.log("🧪 Testing webhook endpoint...");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test_signature", // This will fail signature verification, but we can test the endpoint
      },
      body: JSON.stringify(mockWebhookPayload),
    });

    console.log("Response status:", response.status);
    console.log("Response body:", await response.text());
  } catch (error) {
    console.error("❌ Error testing webhook:", error.message);
  }
};

testWebhook();
