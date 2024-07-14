import { Module } from '@nestjs/common';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateExpense, ExpenseSchema } from './expenses.entity';
import { CategoriesModule } from '../categories/categories.module';
import { BudgetHistoryModule } from '../budget-history/budget-history.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateExpense.name,
        schema: ExpenseSchema,
      },
    ]),
    CategoriesModule,
    BudgetHistoryModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
