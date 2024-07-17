import { Module } from '@nestjs/common';
import { BudgetsController } from './controllers/budgets.controller';
import { BudgetsService } from './services/budgets.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetModel, BudgetSchema } from './budgets.entity';
import { BudgetHistoryModule } from '../budget-history/budget-history.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BudgetModel.name,
        schema: BudgetSchema,
      },
    ]),
    BudgetHistoryModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
