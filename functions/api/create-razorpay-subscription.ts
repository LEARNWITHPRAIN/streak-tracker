// Cloudflare Pages Function: /api/create-razorpay-subscription
// Runs server-side on Cloudflare Pages without needing separate Supabase Edge deployment

const RAZORPAY_KEY_ID = "rzp_live_TgafeietEr0S3D";
const RAZORPAY_KEY_SECRET = "nsYdrYbG3l0kwBgxTtIcAVEw";
const RAZORPAY_PLAN_ID_MONTHLY = "plan_TgakKXEKRZYOJg";
const RAZORPAY_PLAN_ID_YEARLY = "plan_Th1lVp9Rvq3SxO";
const SUPABASE_URL = "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZWV3d3VwdHl3dmpkdHh2eGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDkwNTQsImV4cCI6MjEwMzAyNTA1NH0.zwXFABoIa5Iuv_FKJeMgdMttxQSRffS45LX2P7lUq58";

const TRIAL_DAYS = 7;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function onRequestOptions() {
  return new Response("ok", { headers: corsHeaders });
}

export async function onRequestPost(context: any) {
  const req: Request = context.request;

  try {
    // ── 1. Verify Supabase JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Verify token with Supabase Auth API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid session. Please sign in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await userRes.json();
    const userId = user.id;
    const userEmail = user.email ?? "";

    // ── 2. Parse request body for plan selection ──────────────────────────
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const requestedPlanId = body.plan_id || "";
    const isYearly =
      requestedPlanId === RAZORPAY_PLAN_ID_YEARLY ||
      body.plan_type === "yearly";

    // Strictly enforce the ₹899 plan_Th1lVp9Rvq3SxO for yearly
    const targetPlanId = isYearly ? RAZORPAY_PLAN_ID_YEARLY : RAZORPAY_PLAN_ID_MONTHLY;
    const planAmount = isYearly ? 89900 : 14900;
    const totalCount = isYearly ? 10 : 120; // 10 years of renewals

    // ── 3. Create Razorpay subscription ───────────────────────────────────
    const trialStartMs = Date.now();
    const trialEndMs = trialStartMs + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const startAtUnix = Math.floor(trialEndMs / 1000);

    const razorpayPayload = {
      plan_id: targetPlanId,
      total_count: totalCount,
      quantity: 1,
      start_at: startAtUnix,
      customer_notify: 1,
      notes: {
        user_id: userId,
        user_email: userEmail,
        plan_type: isYearly ? "yearly" : "monthly",
        source: "yodha_mode_trial",
      },
    };

    const basicAuth = "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const razorpayRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": basicAuth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(razorpayPayload),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.text();
      console.error("Razorpay API error:", razorpayRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription with Razorpay. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpaySub = await razorpayRes.json();

    return new Response(
      JSON.stringify({
        subscription_id: razorpaySub.id,
        plan_id: targetPlanId,
        plan_type: isYearly ? "yearly" : "monthly",
        amount: planAmount,
        status: "pending",
        trial_end: new Date(trialEndMs).toISOString(),
        is_existing: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Unexpected error creating Razorpay subscription:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
