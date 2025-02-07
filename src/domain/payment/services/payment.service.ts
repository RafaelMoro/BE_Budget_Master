import Stripe from 'stripe';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from '@/config';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async createCheckoutSession() {
    const stripe = new Stripe(this.configService.stripeApiKey);
  }
}
