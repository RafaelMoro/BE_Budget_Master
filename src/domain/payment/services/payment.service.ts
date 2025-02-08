import Stripe from 'stripe';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { ENVIRONMENT_PRODUCTION, VERSION_RESPONSE } from '@/constants';
import {
  INVALID_PERIODICITY_ERROR,
  LOOK_UP_KEY_RECURRENT_ANNUAL,
  LOOK_UP_KEY_RECURRENT_MONTHLY,
  PRICE_ID_ONE_TIME_ANUAL,
  PRICE_ID_ONE_TIME_MONTLY,
  PRICE_NOT_FOUND_ERROR,
} from '../payment.constants';
import { PaymentDto, PortalDto } from '../dtos/payment.dto';
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
        success_url: `${frontendUri}/payment/one-time/success`,
        cancel_url: `${frontendUri}/payment/one-time/cancel`,
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

  async createRecurrentSession(payload: PaymentDto) {
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
      const lookUpKey =
        payment === 'monthly'
          ? LOOK_UP_KEY_RECURRENT_MONTHLY
          : LOOK_UP_KEY_RECURRENT_ANNUAL;

      const stripe = new Stripe(apiKey);
      const prices = await stripe.prices.list({
        lookup_keys: [lookUpKey],
        expand: ['data.product'],
      });

      if (!prices.data[0]) throw new BadRequestException(PRICE_NOT_FOUND_ERROR);

      const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${frontendUri}/payment/recurrent?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUri}/payment/recurrent?canceled=true`,
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

  async createPortalSession({ sessionId }: PortalDto) {
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
      // this is for demostration purposes to retrieve the customer ID.
      // TODO: Change the obtention of the customer Id retrieving it from the db
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        sessionId,
      );
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer as string,
        return_url: frontendUri,
      });
      const response: OneTimePaymentResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        error: null,
        data: {
          paymentUrl: portalSession.url,
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
