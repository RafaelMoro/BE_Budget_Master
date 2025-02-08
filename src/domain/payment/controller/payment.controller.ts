import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { PaymentDto, PortalDto } from '../dtos/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('one-time')
  createCheckoutOneTimeSession(@Body() payload: PaymentDto) {
    return this.paymentService.createCheckoutOneTimeSession(payload);
  }

  @Post('recurrent')
  createCheckoutRecurrentSession(@Body() payload: PaymentDto) {
    return this.paymentService.createRecurrentSession(payload);
  }

  @Post('portal')
  createPortalSession(@Body() payload: PortalDto) {
    return this.paymentService.createPortalSession(payload);
  }
}
