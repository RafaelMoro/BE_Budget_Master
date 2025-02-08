import Stripe from 'stripe';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { ENVIRONMENT_PRODUCTION } from '@/constants';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async createCheckoutSession() {
    try {
      const priceIdAnualSubscription = 'price_1Qq1TTKQRcBa6IkH2PexcxiH';
      const apiKey =
        this.configService.environment === ENVIRONMENT_PRODUCTION
          ? this.configService.stripeApiKey
          : this.configService.stripeTestApiKey;
      const stripe = new Stripe(apiKey);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: priceIdAnualSubscription,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:6006/success',
        cancel_url: 'http://localhost:6006/cancel',
      });
      console.log(session);
      return session;
    } catch (error) {
      console.log(error);
    }
  }
}
