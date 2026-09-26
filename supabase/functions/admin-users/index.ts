// Supabase Edge Function: admin-users
// Returns all auth users joined with their subscription data.
// PROTECTED: only the configured ADMIN_EMAIL can call this.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://czeewwuptywvjdtxvxhv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_EMAILS = [
  Deno.env.get("ADMIN_EMAIL"),
  "prakharjain2731@gmail.com",
  "prakhargen2731@gmail.com",
  "prakrjgen27318@gmail.com",
]
  .filter(Boolean)
  .map((e) => (e as string).toLowerCase().trim());

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Verify caller is authenticated ─────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT and get caller's user
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Gate: only admin email can proceed ──────────────────────────────
    if (!caller.email || !ADMIN_EMAILS.includes(caller.email.toLowerCase().trim())) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Use service role to query auth.users ────────────────────────────
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // List all users (paginate up to 1000)
    const { data: authData, error: listError } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(JSON.stringify({ error: "Failed to list users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authUsers = authData?.users ?? [];

    // ── 4. Fetch all subscription records ─────────────────────────────────
    const { data: subs, error: subsError } = await serviceClient
      .from("user_subscriptions")
      .select("user_id, status, trial_start, trial_end, current_period_start, current_period_end, created_at, amount, provider_subscription_id, cancel_at_period_end, expires_at, user_email");

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
    }

    // Build a map of user_id -> subscription
    const subMap: Record<string, any> = {};
    for (const sub of (subs ?? [])) {
      if (sub.user_id) subMap[sub.user_id] = sub;
    }

    // ── 5. Merge and return ───────────────────────────────────────────────
    const users = authUsers.map((u: any) => {
      const sub = subMap[u.id] ?? null;
      return {
        id: u.id,
        email: u.email ?? sub?.user_email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed_at: u.confirmed_at ?? u.email_confirmed_at ?? null,
        provider: u.app_metadata?.provider ?? "email",
        // Subscription fields
        sub_status: sub?.status ?? null,
        sub_created_at: sub?.created_at ?? null,
        trial_start: sub?.trial_start ?? null,
        trial_end: sub?.trial_end ?? null,
        current_period_start: sub?.current_period_start ?? null,
        current_period_end: sub?.current_period_end ?? null,
        cancel_at_period_end: sub?.cancel_at_period_end ?? false,
        expires_at: sub?.expires_at ?? null,
        amount: sub?.amount ?? null,
        provider_subscription_id: sub?.provider_subscription_id ?? null,
      };
    });

    // Sort: newest signups first
    users.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return new Response(JSON.stringify({ users, total: users.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error in admin-users:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
