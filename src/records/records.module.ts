import { Module } from '@nestjs/common';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';
import { CategoriesModule } from '../categories/categories.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomesModule } from '../incomes/incomes.module';

@Module({
  imports: [CategoriesModule, ExpensesModule, IncomesModule],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
