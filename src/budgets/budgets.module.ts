import { Module } from '@nestjs/common';
import { BudgetsController } from './controllers/budgets.controller';
import { BudgetsService } from './services/budgets.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './budgets.entity';
import { BudgetHistoryModule } from '../budget-history/budget-history.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Budget.name,
        schema: BudgetSchema,
      },
    ]),
    BudgetHistoryModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
