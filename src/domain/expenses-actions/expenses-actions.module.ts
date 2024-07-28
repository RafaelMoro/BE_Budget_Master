import { Module } from '@nestjs/common';
import { ExpensesActionsController } from './controller/expenses-actions.controller';
import { ExpensesActionsService } from './services/expenses-actions.service';
import { ExpensesModule } from '../../expenses/expenses.module';
import { CategoriesModule } from '../../categories/categories.module';
import { BudgetHistoryModule } from '../../budget-history/budget-history.module';
import { BudgetsModule } from '../../budgets/budgets.module';
import { AccountsModule } from '../../repositories/accounts/accounts.module';

@Module({
  imports: [
    ExpensesModule,
    CategoriesModule,
    BudgetHistoryModule,
    BudgetsModule,
    AccountsModule,
  ],
  controllers: [ExpensesActionsController],
  providers: [ExpensesActionsService],
})
export class ExpensesActionsModule {}
