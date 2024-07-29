import { Module } from '@nestjs/common';
import { IncomesActionsController } from './controller/incomes-actions.controller';
import { IncomesActionsService } from './services/incomes-actions.service';

@Module({
  providers: [IncomesActionsService],
  controllers: [IncomesActionsController],
})
export class IncomesActionsModule {}
