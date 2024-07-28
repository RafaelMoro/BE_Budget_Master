import { Module } from '@nestjs/common';
import { ExpensesController } from './controllers/expenses.controller';
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
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
