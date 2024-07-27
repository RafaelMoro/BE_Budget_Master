import { Module } from '@nestjs/common';
import { ExpensesActionsController } from './controller/expenses-actions.controller';
import { ExpensesActionsService } from './services/expenses-actions.service';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { BudgetHistoryModule } from 'src/budget-history/budget-history.module';
import { BudgetsModule } from 'src/budgets/budgets.module';

@Module({
  imports: [
    ExpensesModule,
    CategoriesModule,
    BudgetHistoryModule,
    BudgetsModule,
  ],
  controllers: [ExpensesActionsController],
  providers: [ExpensesActionsService],
})
export class ExpensesActionsModule {}
