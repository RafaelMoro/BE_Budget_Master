import { Module } from '@nestjs/common';

import { CategoriesModule } from '@/categories/categories.module';
import { ExpensesModule } from '@repositories/expenses/expenses.module';
import { IncomesModule } from '@repositories/incomes/incomes.module';
import { AccountsModule } from '@repositories/accounts/accounts.module';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';

@Module({
  imports: [CategoriesModule, ExpensesModule, IncomesModule, AccountsModule],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
