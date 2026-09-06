// Cloudflare Pages Function: /api/create-subscription
// Creates a Razorpay ₹149/month plan/subscription with seamless fallback

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
    const keyId = context.env?.RAZORPAY_KEY_ID || 'rzp_test_TYcHlwMW8l6WFa';
    const keySecret = context.env?.RAZORPAY_KEY_SECRET || 'VMfyoCVGp3jDXN7USxxq98dX';

    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    };

    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      body = {};
    }

    const { userId, userEmail, userName } = body;

    // 1. Try to create or find Razorpay Subscription Plan (₹149/month)
    let planId = '';
    try {
      const planRes = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          period: 'monthly',
          interval: 1,
          item: {
            name: 'Winter Arc Custom Subscription',
            amount: 14900, // in paise = ₹149
            currency: 'INR',
            description: 'Monthly access to Winter Arc Custom challenges on YodhaMode',
          },
        }),
      });

      if (planRes.ok) {
        const planData = await planRes.json();
        planId = planData.id;
      }
    } catch (e) {
      console.warn('Plan creation note:', e);
    }

    // 2. Try to create Razorpay Subscription
    if (planId) {
      try {
        const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            plan_id: planId,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
              user_id: userId || 'unknown',
              plan: 'winter_arc_custom_149',
            },
          }),
        });

        if (subRes.ok) {
          const subData = await subRes.json();
          return new Response(
            JSON.stringify({
              type: 'subscription',
              subscription_id: subData.id,
              key_id: keyId,
              amount: 14900,
              currency: 'INR',
              name: 'Yodha Mode',
              description: 'Winter Arc Custom - ₹149/month',
            }),
            { headers: corsHeaders }
          );
        }
      } catch (e) {
        console.warn('Subscription creation fallback to order:', e);
      }
    }

    // 3. Fallback: Create Standard Order for ₹149 (always guaranteed to work in Razorpay Test)
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: 14900, // ₹149 in paise
        currency: 'INR',
        receipt: `wrc_${Date.now()}`,
        notes: {
          user_id: userId || 'unknown',
          plan: 'winter_arc_custom_149',
          period: 'monthly',
        },
      }),
    });

    if (!orderRes.ok) {
      const errData = await orderRes.text();
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order with Razorpay', details: errData }),
        { status: 500, headers: corsHeaders }
      );
    }

    const orderData = await orderRes.json();
    return new Response(
      JSON.stringify({
        type: 'order',
        order_id: orderData.id,
        key_id: keyId,
        amount: 14900,
        currency: 'INR',
        name: 'Yodha Mode',
        description: 'Winter Arc Custom - ₹149/month',
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error creating subscription' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
