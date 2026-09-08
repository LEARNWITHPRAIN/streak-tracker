import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TYcHlwMW8l6WFa";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "VMfyoCVGp3jDXN7USxxq98dX";

function razorpayDevApiPlugin() {
  return {
    name: "razorpay-dev-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith("/api/")) return next();

        // Handle CORS preflight
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.statusCode = 204;
          return res.end();
        }

        let bodyBuffer = "";
        req.on("data", (chunk: any) => { bodyBuffer += chunk; });
        req.on("end", async () => {
          let body: any = {};
          try { body = JSON.parse(bodyBuffer); } catch {}

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");

          const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
          const rzpHeaders = {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/json",
          };

          if (req.url === "/api/create-subscription") {
            try {
              // 1. Try to create/get monthly plan
              let planId = "";
              try {
                const planRes = await fetch("https://api.razorpay.com/v1/plans", {
                  method: "POST",
                  headers: rzpHeaders,
                  body: JSON.stringify({
                    period: "monthly",
                    interval: 1,
                    item: {
                      name: "Winter Arc Duel Pass",
                      amount: 14900,
                      currency: "INR",
                      description: "Monthly recurring subscription to create Winter Arc challenges against friends",
                    },
                  }),
                });
                if (planRes.ok) {
                  const planData: any = await planRes.json();
                  planId = planData.id;
                }
              } catch {}

              // 2. Try to create subscription
              if (planId) {
                try {
                  const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
                    method: "POST",
                    headers: rzpHeaders,
                    body: JSON.stringify({
                      plan_id: planId,
                      total_count: 12,
                      quantity: 1,
                      customer_notify: 1,
                      notes: { user_id: body.userId || "unknown", plan: "winter_arc_duel_pass", country: "IN" },
                    }),
                  });
                  if (subRes.ok) {
                    const subData: any = await subRes.json();
                    return res.end(JSON.stringify({
                      type: "subscription",
                      subscription_id: subData.id,
                      key_id: RAZORPAY_KEY_ID,
                      amount: 14900,
                      currency: "INR",
                      name: "Yodha Mode",
                      description: "Winter Arc Duel Pass - ₹149/month",
                    }));
                  }
                } catch {}
              }

              // 3. Fallback: standard ₹149 order
              const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: rzpHeaders,
                body: JSON.stringify({
                  amount: 14900,
                  currency: "INR",
                  receipt: `wrc_${Date.now()}`,
                  notes: { user_id: body.userId || "unknown", plan: "winter_arc_duel_pass", period: "monthly", country: "IN" },
                }),
              });
              const orderData: any = await orderRes.json();
              return res.end(JSON.stringify({
                type: "order",
                order_id: orderData.id,
                key_id: RAZORPAY_KEY_ID,
                amount: 14900,
                currency: "INR",
                name: "Yodha Mode",
                description: "Winter Arc Duel Pass - ₹149/month",
              }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err?.message || "Failed to create subscription" }));
            }
          }

          if (req.url === "/api/verify-subscription") {
            try {
              const { razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature } = body;
              let isValid = false;
              let verifiedType = "";

              if (razorpay_subscription_id) {
                const expected = crypto
                  .createHmac("sha256", RAZORPAY_KEY_SECRET)
                  .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
                  .digest("hex");
                isValid = expected.toLowerCase() === razorpay_signature?.toLowerCase();
                verifiedType = "subscription";
              }

              if (!isValid && razorpay_order_id) {
                const expected = crypto
                  .createHmac("sha256", RAZORPAY_KEY_SECRET)
                  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                  .digest("hex");
                isValid = expected.toLowerCase() === razorpay_signature?.toLowerCase();
                verifiedType = "order";
              }

              if (!isValid) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "Invalid Razorpay payment signature" }));
              }

              const now = new Date();
              const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

              return res.end(JSON.stringify({
                verified: true,
                type: verifiedType,
                status: "active",
                plan_id: "plan_winter_custom_149",
                amount: 149,
                currency: "INR",
                razorpay_payment_id,
                razorpay_subscription_id: razorpay_subscription_id || null,
                razorpay_order_id: razorpay_order_id || null,
                razorpay_signature,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
              }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err?.message || "Verification error" }));
            }
          }

          if (req.url === "/api/cancel-subscription") {
            try {
              const { razorpay_subscription_id } = body;
              if (razorpay_subscription_id) {
                try {
                  await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}/cancel`, {
                    method: "POST",
                    headers: rzpHeaders,
                    body: JSON.stringify({ cancel_at_cycle_end: 0 }),
                  });
                } catch {}
              }
              return res.end(JSON.stringify({ success: true, status: "cancelled", cancelled_at: new Date().toISOString() }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err?.message || "Cancel error" }));
            }
          }

          next();
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: Number(process.env.VITE_PORT) || 8080,
  },

  preview: {
    host: "0.0.0.0",
    port: Number(process.env.VITE_PORT) || 8080,
  },

  plugins: [
    razorpayDevApiPlugin(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

