import Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { broadcastNotification } from './notifications';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<Stripe.Event> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }

    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const amount = pi.amount / 100;
        const method = pi.payment_method_types?.[0] === 'us_bank_account' ? 'ACH' : 'Card';
        const portal = (pi.metadata?.portal as string) || 'customer';
        const notification = await storage.createNotification({
          type: 'payment_received',
          title: 'Payment Received',
          message: `$${amount.toLocaleString()} payment received via ${method}.`,
          portal,
          method,
          amount,
          read: false,
        });
        broadcastNotification(notification);
        console.log('Payment succeeded:', pi.id, `$${amount}`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const amount = pi.amount / 100;
        const method = pi.payment_method_types?.[0] === 'us_bank_account' ? 'ACH' : 'Card';
        const portal = (pi.metadata?.portal as string) || 'customer';
        const notification = await storage.createNotification({
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `$${amount.toLocaleString()} ${method} payment failed. Please retry.`,
          portal,
          method,
          amount,
          read: false,
        });
        broadcastNotification(notification);
        console.log('Payment failed:', pi.id);
        break;
      }
      case 'charge.captured': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge captured:', charge.id);
        break;
      }
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('Dispute closed:', dispute.id);
        break;
      }
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return event;
  }
}
