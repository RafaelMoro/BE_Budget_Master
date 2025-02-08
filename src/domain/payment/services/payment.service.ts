import Stripe from 'stripe';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { ENVIRONMENT_PRODUCTION, VERSION_RESPONSE } from '@/constants';
import {
  INVALID_PERIODICITY_ERROR,
  PRICE_ID_ONE_TIME_ANUAL,
  PRICE_ID_ONE_TIME_MONTLY,
} from '../payment.constants';
import { PaymentDto } from '../dtos/payment.dto';
import { OneTimePaymentResponse } from '../payment.interface';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async createCheckoutOneTimeSession(payload: PaymentDto) {
    try {
      const { payment } = payload;
      if (payment !== 'monthly' && payment !== 'annual')
        throw new BadRequestException(INVALID_PERIODICITY_ERROR);

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

      const priceId =
        payment === 'monthly'
          ? PRICE_ID_ONE_TIME_MONTLY
          : PRICE_ID_ONE_TIME_ANUAL;

      const stripe = new Stripe(apiKey);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUri}/payment/success`,
        cancel_url: `${frontendUri}/payment/cancel`,
      });

      const response: OneTimePaymentResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        error: null,
        data: {
          paymentUrl: session.url,
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
