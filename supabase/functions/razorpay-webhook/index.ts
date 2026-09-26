// Supabase Edge Function: razorpay-webhook
// Receives and processes all Razorpay subscription webhook events
// Security: verifies HMAC-SHA256 signature before any processing
// Idempotency: deduplicates by event_id

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Map Razorpay subscription states → our internal states
const RAZORPAY_STATUS_MAP: Record<string, string> = {
  created:       "pending",
  authenticated: "trialing",
  active:        "active",
  pending:       "past_due",
  halted:        "halted",
  cancelled:     "cancelled",
  completed:     "expired",
  paused:        "paused",
  resumed:       "active",
};

async function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const bodyData = encoder.encode(rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, bodyData);
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === signature;
}

serve(async (req: Request) => {
  // Webhook only accepts POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // ── 1. Get raw body BEFORE any JSON parsing ────────────────────────────
    const rawBody = await req.text();

    // ── 2. Verify Razorpay webhook signature ──────────────────────────────
    const signature = req.headers.get("X-Razorpay-Signature") ?? "";

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const isValid = await verifyRazorpaySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature — rejecting");
      return new Response("Invalid signature", { status: 400 });
    }

    // ── 3. Parse payload ──────────────────────────────────────────────────
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const eventType: string = payload.event ?? "";
    const eventId: string = payload.id ?? payload.payload?.id ?? `${eventType}_${Date.now()}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 4. Idempotency check — skip if already processed ─────────────────
    const { data: existingEvent } = await supabase
      .from("razorpay_webhook_events")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      console.log(`Duplicate webhook received — already processed: ${eventId}`);
      return new Response("OK", { status: 200 });
    }

    // ── 5. Store webhook event (before processing — guarantees we record it) ─
    if (!existingEvent) {
      const { error: insertEventError } = await supabase
        .from("razorpay_webhook_events")
        .insert({
          event_id: eventId,
          event_type: eventType,
          payload: payload,
          processed: false,
        });

      if (insertEventError) {
        // Duplicate key = already inserted by concurrent request — safe to continue
        if (!insertEventError.message.includes("duplicate")) {
          console.error("Failed to store webhook event:", insertEventError);
        }
      }
    }

    // ── 6. Extract subscription entity from payload ───────────────────────
    const subscriptionEntity = payload.payload?.subscription?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!subscriptionEntity) {
      console.warn(`No subscription entity in event: ${eventType}`);
      await markEventProcessed(supabase, eventId);
      return new Response("OK", { status: 200 });
    }

    const providerSubscriptionId: string = subscriptionEntity.id;

    // ── 7. Find subscription in our DB ────────────────────────────────────
    const { data: subRecord, error: subFetchError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, status, provider_subscription_id")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();

    if (subFetchError) {
      console.error("Error fetching subscription:", subFetchError);
    }

    // ── 8. Handle each event type ─────────────────────────────────────────
    switch (eventType) {

      case "subscription.authenticated": {
        // User has authorized the mandate — trial begins
        // start_at is when first charge will happen (trial end)
        const startAt = subscriptionEntity.start_at
          ? new Date(subscriptionEntity.start_at * 1000).toISOString()
          : null;
        const now = new Date().toISOString();

        const updateData: Record<string, any> = {
          status: "trialing",
          trial_start: now,
          trial_end: startAt,
          updated_at: now,
        };

        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update(updateData)
            .eq("id", subRecord.id);
        } else {
          // Subscription not in our DB yet (possible if Edge Function insert failed)
          // Try to find by user notes
          console.warn("Subscription not found in DB for authenticated event:", providerSubscriptionId);
          await upsertSubscriptionFromRazorpay(supabase, subscriptionEntity, updateData);
        }
        break;
      }

      case "subscription.activated": {
        // Subscription moved from authenticated/pending/halted to active
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "active", updated_at: now })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.charged": {
        // Successful recurring payment — most important event
        const now = new Date().toISOString();
        const chargeAt = subscriptionEntity.charge_at
          ? new Date(subscriptionEntity.charge_at * 1000).toISOString()
          : null;
        const currentStart = subscriptionEntity.current_start
          ? new Date(subscriptionEntity.current_start * 1000).toISOString()
          : null;
        const currentEnd = subscriptionEntity.current_end
          ? new Date(subscriptionEntity.current_end * 1000).toISOString()
          : null;

        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({
              status: "active",
              current_period_start: currentStart,
              current_period_end: currentEnd,
              updated_at: now,
            })
            .eq("id", subRecord.id);

          // Record payment in payment_history
          if (paymentEntity) {
            await supabase.from("payment_history").insert({
              user_id: subRecord.user_id,
              subscription_id: subRecord.id,
              razorpay_payment_id: paymentEntity.id,
              razorpay_subscription_id: providerSubscriptionId,
              amount: paymentEntity.amount ?? 14900,
              currency: paymentEntity.currency ?? "INR",
              status: paymentEntity.status ?? "captured",
              payment_type: "recurring",
            });
          }
        }
        break;
      }

      case "subscription.pending": {
        // Payment failed — Razorpay will retry automatically
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "past_due", updated_at: now })
            .eq("id", subRecord.id);

          // Record the failed payment attempt
          if (paymentEntity) {
            await supabase.from("payment_history").insert({
              user_id: subRecord.user_id,
              subscription_id: subRecord.id,
              razorpay_payment_id: paymentEntity.id ?? null,
              razorpay_subscription_id: providerSubscriptionId,
              amount: 14900,
              currency: "INR",
              status: "failed",
              payment_type: "recurring",
            });
          }
        }
        break;
      }

      case "subscription.halted": {
        // All retries exhausted — subscription halted
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "halted", updated_at: now })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.cancelled": {
        // Subscription officially cancelled
        const now = new Date().toISOString();
        const endAt = subscriptionEntity.end_at
          ? new Date(subscriptionEntity.end_at * 1000).toISOString()
          : null;

        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({
              status: "cancelled",
              cancel_at_period_end: true,
              // Preserve period end for access until date
              current_period_end: endAt || subRecord.current_period_end,
              updated_at: now,
            })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.completed": {
        // All invoices generated — subscription expired naturally
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "expired", updated_at: now })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.paused": {
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "paused", updated_at: now })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.resumed": {
        const now = new Date().toISOString();
        if (subRecord) {
          await supabase
            .from("user_subscriptions")
            .update({ status: "active", updated_at: now })
            .eq("id", subRecord.id);
        }
        break;
      }

      case "subscription.updated": {
        // Plan/quantity update — no subscription state change needed
        console.log("Subscription updated event received:", providerSubscriptionId);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${eventType}`);
        break;
      }
    }

    // ── 9. Mark event as processed ────────────────────────────────────────
    await markEventProcessed(supabase, eventId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Unexpected error in razorpay-webhook:", err);
    return new Response("Internal server error", { status: 500 });
  }
});

async function markEventProcessed(supabase: any, eventId: string) {
  await supabase
    .from("razorpay_webhook_events")
    .update({ processed: true })
    .eq("event_id", eventId);
}

async function upsertSubscriptionFromRazorpay(
  supabase: any,
  subscriptionEntity: any,
  extraFields: Record<string, any>
) {
  // Try to recover from Razorpay notes
  const notes = subscriptionEntity.notes ?? {};
  const userId = notes.user_id;
  const userEmail = notes.user_email ?? "";

  if (!userId) {
    console.warn("Cannot upsert subscription — no user_id in Razorpay notes");
    return;
  }

  await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      user_email: userEmail,
      payment_provider: "razorpay",
      provider_subscription_id: subscriptionEntity.id,
      provider_plan_id: subscriptionEntity.plan_id,
      currency: "INR",
      amount: 14900,
      ...extraFields,
    },
    { onConflict: "provider_subscription_id" }
  );
}
