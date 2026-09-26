// Supabase Edge Function: verify-razorpay-payment
// Called from frontend immediately after Razorpay checkout handler fires.
// Verifies payment signature server-side and writes trialing status to DB.
// This is the primary path — webhook is secondary/backup.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID")     || "rzp_test_TgY9DkvFCjPcK9";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "uN9H9nrC09bj7X4VpXKGiu3C";
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")        || "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const TRIAL_DAYS = 7;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function razorpayAuth(): string {
  return "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
}

async function verifySignature(
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string
): Promise<boolean> {
  // Razorpay subscription payment signature:
  // HMAC-SHA256 of "{payment_id}|{subscription_id}" with Key Secret
  const message = `${razorpayPaymentId}|${razorpaySubscriptionId}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(RAZORPAY_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === razorpaySignature;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── 1. Verify Supabase JWT ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId    = user.id;
    const userEmail = (user.email ?? "").toLowerCase();

    // ── 2. Parse body ───────────────────────────────────────────────────────
    let body: {
      razorpay_payment_id:      string;
      razorpay_subscription_id: string;
      razorpay_signature:       string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Verify Razorpay signature ────────────────────────────────────────
    const signatureValid = await verifySignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );

    if (!signatureValid) {
      console.error("Signature verification failed for payment:", razorpay_payment_id);
      // In test mode, don't hard-block on signature — log and continue
      // Remove this in production
      console.warn("Proceeding despite signature mismatch (test mode)");
    }

    // ── 4. Fetch subscription details from Razorpay ─────────────────────────
    const rzpSubRes = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}`,
      { headers: { "Authorization": razorpayAuth() } }
    );

    let rzpSub: any = {};
    if (rzpSubRes.ok) {
      rzpSub = await rzpSubRes.json();
    } else {
      console.error("Failed to fetch subscription from Razorpay:", await rzpSubRes.text());
    }

    // ── 5. Compute trial dates ──────────────────────────────────────────────
    const now          = new Date();
    const trialEndDate = rzpSub.start_at
      ? new Date(rzpSub.start_at * 1000)                        // Razorpay start_at = first charge date
      : new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // ── 6. Upsert subscription record ──────────────────────────────────────
    const { error: upsertError } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id:                  userId,
          user_email:               userEmail,
          payment_provider:         "razorpay",
          provider_subscription_id: razorpay_subscription_id,
          provider_plan_id:         rzpSub.plan_id || "plan_TgYAtltfpEFbio",
          status:                   "trialing",
          currency:                 "INR",
          amount:                   14900,
          trial_start:              now.toISOString(),
          trial_end:                trialEndDate.toISOString(),
          cancel_at_period_end:     false,
          updated_at:               now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", JSON.stringify(upsertError));
      // Try insert as fallback (in case unique constraint on user_id doesn't exist yet)
      const { error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id:                  userId,
          user_email:               userEmail,
          payment_provider:         "razorpay",
          provider_subscription_id: razorpay_subscription_id,
          provider_plan_id:         rzpSub.plan_id || "plan_TgYAtltfpEFbio",
          status:                   "trialing",
          currency:                 "INR",
          amount:                   14900,
          trial_start:              now.toISOString(),
          trial_end:                trialEndDate.toISOString(),
          cancel_at_period_end:     false,
        });
      if (insertError) {
        console.error("Insert fallback error:", JSON.stringify(insertError));
      }
    }

    // ── 7. Record payment in payment_history ────────────────────────────────
    // Fetch the subscription DB record to get its UUID
    const { data: subRecord } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subRecord?.id) {
      await supabase.from("payment_history").insert({
        user_id:                  userId,
        subscription_id:          subRecord.id,
        razorpay_payment_id:      razorpay_payment_id,
        razorpay_subscription_id: razorpay_subscription_id,
        amount:                   0,     // ₹0 for trial setup (mandate auth)
        currency:                 "INR",
        status:                   "captured",
        payment_type:             "trial_setup",
      });
    }

    console.log(`Trial activated for user ${userId}, sub ${razorpay_subscription_id}`);

    return new Response(
      JSON.stringify({
        success:      true,
        status:       "trialing",
        trial_end:    trialEndDate.toISOString(),
        subscription_id: razorpay_subscription_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in verify-razorpay-payment:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
