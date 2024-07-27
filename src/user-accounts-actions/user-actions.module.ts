import { Module } from '@nestjs/common';
import { UserAccountsActionsService } from './services/user-accounts-actions.service';
import { UserAccountsActionsController } from './controller/account-actions.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { RecordsModule } from 'src/records/records.module';
import { BudgetsModule } from 'src/budgets/budgets.module';
import { BudgetHistoryModule } from 'src/budget-history/budget-history.module';
import { AccountsActionsService } from './services/Accounts/accounts.-actions.service';

@Module({
  imports: [AccountsModule, RecordsModule, BudgetsModule, BudgetHistoryModule],
  providers: [UserAccountsActionsService, AccountsActionsService],
  controllers: [UserAccountsActionsController],
})
export class UserActionsModule {}
