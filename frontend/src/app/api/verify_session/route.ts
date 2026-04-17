import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        metadata: session.metadata,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment not completed or failed',
        paymentStatus: session.payment_status,
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Error verifying session:', err);
    return NextResponse.json(
      { error: 'Error verifying checkout session', details: err.message },
      { status: 500 }
    );
  }
}
