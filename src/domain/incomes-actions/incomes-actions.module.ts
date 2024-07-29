import { Module } from '@nestjs/common';
import { IncomesActionsController } from './controller/incomes-actions.controller';
import { IncomesActionsService } from './services/incomes-actions.service';
import { IncomesModule } from 'src/repositories/incomes/incomes.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ExpensesModule } from 'src/repositories/expenses/expenses.module';
import { AccountsModule } from 'src/repositories/accounts/accounts.module';

@Module({
  imports: [IncomesModule, CategoriesModule, ExpensesModule, AccountsModule],
  providers: [IncomesActionsService],
  controllers: [IncomesActionsController],
})
export class IncomesActionsModule {}
