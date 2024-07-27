import { Module } from '@nestjs/common';
import { UserAccountsActionsService } from './services/user-accounts-actions.service';
import { UserAccountsActionsController } from './controller/user-accounts-actions.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { RecordsModule } from 'src/records/records.module';
import { BudgetsModule } from 'src/budgets/budgets.module';
import { BudgetHistoryModule } from 'src/budget-history/budget-history.module';
import { AccountsUserAccountsActionsService } from './services/accounts.user-accounts-actions/accounts.user-accounts-actions.service';

@Module({
  imports: [AccountsModule, RecordsModule, BudgetsModule, BudgetHistoryModule],
  providers: [UserAccountsActionsService, AccountsUserAccountsActionsService],
  controllers: [UserAccountsActionsController],
})
export class UserAccountsActionsModule {}
