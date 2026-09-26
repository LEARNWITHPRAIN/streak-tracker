// Supabase Edge Function: cancel-razorpay-subscription
// Cancels the user's active Razorpay subscription at end of current billing period

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_TgY9DkvFCjPcK9";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "uN9H9nrC09bj7X4VpXKGiu3C";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function razorpayBasicAuth(): string {
  return "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
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
    // ── 1. Verify Supabase JWT ─────────────────────────────────────────────
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

    const userId = user.id;

    // ── 2. Find user's cancellable subscription ────────────────────────────
    const { data: subs, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("id, status, provider_subscription_id, current_period_end, trial_end, cancel_at_period_end")
      .eq("user_id", userId)
      .in("status", ["trialing", "active", "pending", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching subscription:", fetchError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sub = subs[0];

    if (sub.cancel_at_period_end) {
      return new Response(
        JSON.stringify({
          message: "Subscription is already scheduled to cancel",
          status: sub.status,
          access_until: sub.current_period_end || sub.trial_end,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub.provider_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No Razorpay subscription ID found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Cancel via Razorpay API (at end of current cycle) ─────────────
    const cancelRes = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${sub.provider_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": razorpayBasicAuth(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      }
    );

    if (!cancelRes.ok) {
      const errBody = await cancelRes.text();
      console.error("Razorpay cancel error:", cancelRes.status, errBody);

      // If already cancelled on Razorpay's side, update our DB
      if (cancelRes.status === 400) {
        await supabase
          .from("user_subscriptions")
          .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq("id", sub.id);
        return new Response(
          JSON.stringify({ message: "Subscription cancelled", status: "cancelled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to cancel subscription. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cancelledSub = await cancelRes.json();

    // ── 4. Update Supabase to reflect cancellation scheduled ──────────────
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        // Razorpay may return an end_at on the cancelled subscription
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      // Razorpay cancellation succeeded — webhook will sync state
    }

    // Access continues until period end; webhook 'subscription.cancelled' will finalize
    const accessUntil = sub.current_period_end || sub.trial_end;

    return new Response(
      JSON.stringify({
        message: "Subscription will cancel at end of current period",
        status: sub.status,
        cancel_at_period_end: true,
        access_until: accessUntil,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in cancel-razorpay-subscription:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
