import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { PaymentDto } from '../dtos/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  createCheckoutOneTimeSession(@Body() payload: PaymentDto) {
    return this.paymentService.createCheckoutOneTimeSession(payload);
  }
}
