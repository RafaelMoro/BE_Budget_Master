import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordsController } from './controllers/records.controller';
import { CreateExpense, ExpenseSchema } from './entities/expenses.entity';
import { CreateIncome, IncomeSchema } from './entities/incomes.entity';
import { AccountRecord, RecordsSchema } from './entities/records.entity';
import { RecordsService } from './services/records.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccountRecord.name,
        schema: RecordsSchema,
      },
      {
        name: CreateExpense.name,
        schema: ExpenseSchema,
      },
      {
        name: CreateIncome.name,
        schema: IncomeSchema,
      },
    ]),
    CategoriesModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
