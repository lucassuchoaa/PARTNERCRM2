import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, planName, planId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const stripe = getStripeClient();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      metadata: {
        planName: planName || 'Unknown',
        planId: planId || 'unknown'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

router.post('/create-subscription', async (req, res) => {
  try {
    const { email, name, planId, priceId } = req.body;

    if (!email || !priceId) {
      return res.status(400).json({
        success: false,
        error: 'Email and priceId are required'
      });
    }

    const stripe = getStripeClient();
    
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        planId: planId || 'unknown'
      }
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      throw new Error('Failed to create invoice');
    }

    const paymentIntent = latestInvoice.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') {
      throw new Error('Failed to create payment intent');
    }

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
});

export default router;
