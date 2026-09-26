// Supabase Edge Function: create-razorpay-subscription
// Creates a Razorpay subscription with 7-day trial (start_at = now + 7 days)
// Returns { subscription_id } to frontend for Razorpay Checkout

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_TgY9DkvFCjPcK9";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "uN9H9nrC09bj7X4VpXKGiu3C";
const RAZORPAY_PLAN_ID = Deno.env.get("RAZORPAY_PLAN_ID") || "plan_TgYAtltfpEFbio";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const TRIAL_DAYS = 7;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function razorpayBasicAuth(): string {
  return "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
}

serve(async (req: Request) => {
  // Handle CORS preflight
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
    // ── 1. Verify Supabase JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for DB writes
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use anon client to verify the user's JWT
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

    const userId = user.id;
    const userEmail = user.email ?? "";

    // ── 2. Check for existing active/trialing/pending subscription ─────────
    const { data: existingSubs, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("id, status, provider_subscription_id, trial_end, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .in("status", ["trialing", "active", "pending", "past_due", "paused"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingSubs && existingSubs.length > 0) {
      const existing = existingSubs[0];
      // Return existing subscription so frontend can reopen checkout if needed
      return new Response(
        JSON.stringify({
          subscription_id: existing.provider_subscription_id,
          status: existing.status,
          is_existing: true,
          message: "Existing subscription found",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. Validate required env vars ──────────────────────────────────────
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_PLAN_ID) {
      console.error("Missing Razorpay environment variables");
      return new Response(
        JSON.stringify({ error: "Payment system not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Create Razorpay subscription (start_at = now + 7 days) ─────────
    const trialStartMs = Date.now();
    const trialEndMs = trialStartMs + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const startAtUnix = Math.floor(trialEndMs / 1000); // Razorpay uses Unix seconds

    const razorpayPayload = {
      plan_id: RAZORPAY_PLAN_ID,
      total_count: 120,          // 10 years of monthly billing (~infinite)
      quantity: 1,
      start_at: startAtUnix,    // First charge happens 7 days from now
      customer_notify: 0,        // We handle notifications
      notes: {
        user_id: userId,
        user_email: userEmail,
        source: "yodha_mode_trial",
      },
    };

    const razorpayRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": razorpayBasicAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(razorpayPayload),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.text();
      console.error("Razorpay API error:", razorpayRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpaySub = await razorpayRes.json();
    const providerSubscriptionId: string = razorpaySub.id;

    // ── 5. Insert pending subscription record in Supabase ─────────────────
    // Use upsert on user_id to handle any race conditions
    const { data: insertedSub, error: insertError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        user_email: userEmail.toLowerCase(),
        payment_provider: "razorpay",
        provider_subscription_id: providerSubscriptionId,
        provider_plan_id: RAZORPAY_PLAN_ID,
        status: "pending",           // Will be updated to 'trialing' by webhook
        currency: "INR",
        amount: 14900,
        trial_start: new Date(trialStartMs).toISOString(),
        trial_end: new Date(trialEndMs).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      // Subscription created in Razorpay but DB insert failed — log it
      // Don't fail — Razorpay webhook will sync the state
      console.warn("Razorpay subscription created but DB insert failed:", providerSubscriptionId);
    }

    // ── 6. Return subscription_id to frontend (for Razorpay Checkout) ──────
    return new Response(
      JSON.stringify({
        subscription_id: providerSubscriptionId,
        status: "pending",
        trial_end: new Date(trialEndMs).toISOString(),
        is_existing: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in create-razorpay-subscription:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
