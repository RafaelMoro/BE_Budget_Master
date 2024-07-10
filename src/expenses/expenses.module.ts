import { Module } from '@nestjs/common';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateExpense, ExpenseSchema } from './expenses.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateExpense.name,
        schema: ExpenseSchema,
      },
    ]),
    CategoriesModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
