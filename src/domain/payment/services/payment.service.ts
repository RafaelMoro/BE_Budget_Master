import Stripe from 'stripe';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { ENVIRONMENT_PRODUCTION } from '@/constants';
import { PRICE_ID_ONE_TIME_MONTLY } from '../payment.constants';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async createCheckoutOneTimeSession() {
    try {
      const {
        environment,
        stripeApiKey,
        stripeTestApiKey,
        domainUri,
        frontendPort,
      } = this.configService;

      const apiKey =
        environment === ENVIRONMENT_PRODUCTION
          ? stripeApiKey
          : stripeTestApiKey;
      const frontendUri =
        environment === ENVIRONMENT_PRODUCTION
          ? domainUri
          : `http://localhost:${frontendPort}`;

      const stripe = new Stripe(apiKey);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: PRICE_ID_ONE_TIME_MONTLY,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUri}/payment/success`,
        cancel_url: `${frontendUri}/payment/cancel`,
      });
      console.log(session);
      return session;
    } catch (error) {
      console.log(error);
    }
  }
}
