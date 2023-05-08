import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordsController } from './controllers/records.controller';
import { Expense, ExpenseSchema } from './entities/expenses.entity';
import { Income, IncomeSchema } from './entities/incomes.entity';
import { AccountRecord, RecordsSchema } from './entities/records.entity';
import { RecordsService } from './services/records.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccountRecord.name,
        schema: RecordsSchema,
      },
      {
        name: Expense.name,
        schema: ExpenseSchema,
      },
      {
        name: Income.name,
        schema: IncomeSchema,
      },
    ]),
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
