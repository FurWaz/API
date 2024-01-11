import type express from 'express';
import Stripe from 'stripe';

const STRIPE_KEY = process.env.STRIPE_KEY as string;
const stripe = new Stripe(STRIPE_KEY, {
    appInfo: {
        name: 'FurWaz API',
        version: '1.0.0',
        url: 'https://main.apis.furwaz.fr'
    }
});

export async function checkout (req: express.Request, res: express.Response) {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: 800,
        currency: 'eur',
        automatic_payment_methods: {
            enabled: false
        },
        payment_method_types: ['card', 'paypal']
    });

    res.send({
        clientSecret: paymentIntent.client_secret
    });
};

export function webhook (req: express.Request, res: express.Response) {
    const key = req.headers['stripe-signature'] as string;
    const ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent((req as any).rawBody, key, ENDPOINT_SECRET);
        console.log('✅ Webhook Success')
        res.status(200).send('Success');
    } catch (err: any) {
        console.error(err.message);
        res.status(400).send('Error');
        return;
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('PaymentIntent was successful! ' + event.data.object.id);
            break;
        case 'payment_intent.payment_failed':
            console.log('PaymentMethod was failed! ' + event.data.object.id);
            break;
        default:
            break;
    }
};
