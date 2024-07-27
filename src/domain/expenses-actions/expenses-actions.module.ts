import { Module } from '@nestjs/common';
import { ExpensesActionsController } from './controller/expenses-actions.controller';
import { ExpensesActionsService } from './services/expenses-actions.service';

@Module({
  controllers: [ExpensesActionsController],
  providers: [ExpensesActionsService],
})
export class ExpensesActionsModule {}
