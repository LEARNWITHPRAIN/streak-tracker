import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Verify Razorpay webhook signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedSignature === signature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    console.log("Received webhook payload:", payload);
    console.log("Signature:", signature);

    // Verify signature if webhook secret is configured
    if (webhookSecret && signature) {
      const isValid = await verifySignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      console.log("Webhook signature verified successfully");
    } else {
      console.log("Skipping signature verification (no secret configured or no signature provided)");
    }

    const event = JSON.parse(payload);
    console.log("Event type:", event.event);

    // Handle payment captured event (successful payment)
    if (event.event === "payment.captured" || event.event === "payment_link.paid") {
      const payment = event.payload?.payment?.entity || event.payload?.payment_link?.entity?.payments?.[0];
      
      if (!payment) {
        console.log("No payment entity found in webhook");
        return new Response(
          JSON.stringify({ message: "No payment entity found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const paymentId = payment.id;
      const email = payment.email || event.payload?.payment_link?.entity?.customer?.email;
      const notes = payment.notes || {};
      
      console.log("Payment captured:", { paymentId, email, notes });

      // Try to find user by email
      if (email) {
        // Get user from auth.users by email
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error("Error listing users:", authError);
        } else {
          const user = authUsers.users.find(u => u.email === email);
          
          if (user) {
            console.log("Found user:", user.id);
            
            // Update profile subscription status
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ 
                subscription_status: "active",
                razorpay_payment_id: paymentId 
              })
              .eq("user_id", user.id);

            if (updateError) {
              console.error("Error updating profile:", updateError);
            } else {
              console.log("Successfully activated subscription for user:", user.id);
            }
          } else {
            console.log("No user found with email:", email);
          }
        }
      } else {
        console.log("No email found in payment");
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
