import { Body, Get, Controller, Post, Request } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  createCheckoutOneTimeSession() {
    return this.paymentService.createCheckoutOneTimeSession();
  }
}
