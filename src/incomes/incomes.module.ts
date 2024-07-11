import { Module } from '@nestjs/common';
import { IncomesController } from './controllers/incomes.controller';
import { IncomesService } from './services/incomes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateIncome, IncomeSchema } from './incomes.entity';
import { CategoriesModule } from '../categories/categories.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateIncome.name,
        schema: IncomeSchema,
      },
    ]),
    CategoriesModule,
    ExpensesModule,
  ],
  controllers: [IncomesController],
  providers: [IncomesService],
})
export class IncomesModule {}
