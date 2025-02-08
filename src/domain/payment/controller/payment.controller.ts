import { Body, Get, Controller, Post, Request } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  createCheckoutSession() {
    return this.paymentService.createCheckoutSession();
  }
}
