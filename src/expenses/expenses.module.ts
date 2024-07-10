import { Module } from '@nestjs/common';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateExpense, ExpenseSchema } from './expenses.entity';
import { CategoriesModule } from '../categories/categories.module';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateExpense.name,
        schema: ExpenseSchema,
      },
    ]),
    CategoriesModule,
    RecordsModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
