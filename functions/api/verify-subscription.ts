// Cloudflare Pages Function: /api/verify-subscription
// Verifies Razorpay HMAC SHA256 signature server-side

async function verifyHmacSha256(secret: string, data: string, signature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(sigBuffer));
  const expectedSig = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedSig.toLowerCase() === signature.toLowerCase();
}

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
    const keySecret = context.env?.RAZORPAY_KEY_SECRET || 'ufuPxNPIIEdGu6DatQCIPjhG';

    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_order_id,
      razorpay_signature,
      userId,
    } = body;

    if (!razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing payment verification credentials' }),
        { status: 400, headers: corsHeaders }
      );
    }

    let isValid = false;
    let verifiedType = '';

    // Verify subscription signature: payment_id + '|' + subscription_id
    if (razorpay_subscription_id) {
      const dataToSign = `${razorpay_payment_id}|${razorpay_subscription_id}`;
      isValid = await verifyHmacSha256(keySecret, dataToSign, razorpay_signature);
      verifiedType = 'subscription';
    }

    // Verify order signature: order_id + '|' + payment_id
    if (!isValid && razorpay_order_id) {
      const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      isValid = await verifyHmacSha256(keySecret, dataToSign, razorpay_signature);
      verifiedType = 'order';
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Payment signature verification failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days valid

    return new Response(
      JSON.stringify({
        verified: true,
        type: verifiedType,
        status: 'active',
        plan_id: 'plan_winter_custom_149',
        amount: 149,
        currency: 'INR',
        razorpay_payment_id,
        razorpay_subscription_id: razorpay_subscription_id || null,
        razorpay_order_id: razorpay_order_id || null,
        razorpay_signature,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error verifying payment' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
