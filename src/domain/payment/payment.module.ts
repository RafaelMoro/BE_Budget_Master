import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';

@Module({
  controllers: [PaymentController],
})
export class PaymentModule {}
