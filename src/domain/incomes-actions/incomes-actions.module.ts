import { Module } from '@nestjs/common';
import { IncomesActionsController } from './controller/incomes-actions.controller';
import { IncomesActionsService } from './services/incomes-actions.service';
import { IncomesModule } from 'src/incomes/incomes.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ExpensesModule } from 'src/expenses/expenses.module';

@Module({
  imports: [IncomesModule, CategoriesModule, ExpensesModule],
  providers: [IncomesActionsService],
  controllers: [IncomesActionsController],
})
export class IncomesActionsModule {}
