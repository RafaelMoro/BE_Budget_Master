import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { PaymentDto, PortalDto } from '../dtos/payment.dto';
import { Request } from 'express';

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

  @Get('customer/:customerId')
  getCustomer(@Param('customerId') customerId: string) {
    return this.paymentService.getCustomer(customerId);
  }

  @Get('entitlements/:customerId')
  getEntitlements(@Param('customerId') customerId: string) {
    return this.paymentService.getEntitlements(customerId);
  }

  @Post('webhook')
  getWebhookSubcriptions(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody;
    // return this.paymentService.getWebhookSubcription({ signature, payload });
  }
}
