import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'sk_test_123' || STRIPE_SECRET_KEY.startsWith('your_')) {
  console.error("⚠️ STRIPE_SECRET_KEY is missing or invalid in environment variables.");
  throw new Error("Stripe secret key is not configured.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received checkout request:", body);
    
    if (!body) {
      throw new Error("Empty request body");
    }

    const { formData, amount, successUrl, cancelUrl } = body;

    if (!formData || typeof amount !== 'number') {
      throw new Error("Missing required fields: formData or amount");
    }

    // Stripe metadata values MUST be exactly strings under 500 characters
    // Null or undefined values throw 400 errors from the Stripe API
    const metadata = {
      artistId: String(formData.artistId || ''),
      artistName: String(formData.artistName || ''),
      clientName: String(formData.clientName || ''),
      clientEmail: String(formData.clientEmail || ''),
      clientId: String(formData.clientId || ''),
      eventDate: String(formData.eventDate || ''),
      startTime: String(formData.startTime || ''),
      endTime: String(formData.endTime || ''),
      eventTitle: String(formData.eventTitle || ''),
      location: String(formData.location || ''),
      specialRequest: String(formData.specialRequest || '').substring(0, 200),
      totalPrice: String(formData.totalPrice || '0'),
      advanceAmount: String(amount || '0'),
    };

    console.log("Creating Stripe Session with metadata:", metadata);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: "Advance Payment to reserve " + (formData.artistName || 'Artist'),
              description: "Booking on " + (formData.eventDate || 'TBD') + " (" + (formData.startTime || 'TBD') + " - " + (formData.endTime || 'TBD') + ") - Event: " + (formData.eventTitle || 'TBD'),
            },
            unit_amount: Math.max(50, Math.round(amount * 100)), // Stripe requires amount in cents. $0.50 minimum.
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      metadata: metadata,
    });

    console.log("Created checkout session:", session.id);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('SERVER ERROR creating checkout session:', err);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: err.message || err.toString() },
      { status: 500 }
    );
  }
}
