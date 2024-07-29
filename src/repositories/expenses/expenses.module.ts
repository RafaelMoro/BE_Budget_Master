import { Module } from '@nestjs/common';
import { ExpensesService } from './services/expenses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateExpense, ExpenseSchema } from './expenses.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateExpense.name,
        schema: ExpenseSchema,
      },
    ]),
  ],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
