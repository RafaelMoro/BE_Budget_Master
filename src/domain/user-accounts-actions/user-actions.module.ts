import { Module } from '@nestjs/common';
import { UserAccountsActionsController } from './controller/account-actions.controller';
import { AccountsModule } from '@repositories/accounts/accounts.module';
import { RecordsModule } from '@domain/records/records.module';
import { BudgetsModule } from '../../budgets/budgets.module';
import { BudgetHistoryModule } from '../../budget-history/budget-history.module';
import { AccountsActionsService } from './services/accounts.-actions.service';

@Module({
  imports: [AccountsModule, RecordsModule, BudgetsModule, BudgetHistoryModule],
  providers: [AccountsActionsService],
  controllers: [UserAccountsActionsController],
})
export class UserActionsModule {}
