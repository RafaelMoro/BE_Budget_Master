import { Module } from '@nestjs/common';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';
import { CategoriesModule } from '../categories/categories.module';
import { ExpensesModule } from '../repositories/expenses/expenses.module';
import { IncomesModule } from '../incomes/incomes.module';
import { AccountsModule } from 'src/repositories/accounts/accounts.module';

@Module({
  imports: [CategoriesModule, ExpensesModule, IncomesModule, AccountsModule],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
