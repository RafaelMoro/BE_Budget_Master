import { Module } from '@nestjs/common';
import { BudgetHistoryController } from './controllers/budget-history.controller';
import { BudgetHistoryService } from './services/budget-history.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BudgetHistoryModel,
  BudgetHistorySchema,
} from './budget-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BudgetHistoryModel.name,
        schema: BudgetHistorySchema,
      },
    ]),
  ],
  controllers: [BudgetHistoryController],
  providers: [BudgetHistoryService],
  exports: [BudgetHistoryService],
})
export class BudgetHistoryModule {}
