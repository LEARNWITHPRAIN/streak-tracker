// Cloudflare Pages Function: /api/cancel-subscription
// Cancels a Razorpay subscription

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const keyId = context.env?.RAZORPAY_KEY_ID || 'rzp_live_TZPoNoEqMJ8HKq';
    const keySecret = context.env?.RAZORPAY_KEY_SECRET || 'ufuPxNPIIEdGu6DatQCIPjhG';

    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      body = {};
    }

    const { razorpay_subscription_id } = body;

    // If there is an active Razorpay subscription ID, notify Razorpay
    if (razorpay_subscription_id) {
      try {
        const basicAuth = btoa(`${keyId}:${keySecret}`);
        await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_at_cycle_end: 0 }),
        });
      } catch (e) {
        console.warn('Razorpay cancel API note:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to cancel subscription' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
