import { Module } from '@nestjs/common';
import { BudgetHistoryController } from './controllers/budget-history.controller';
import { BudgetHistoryService } from './services/budget-history.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetHistory, BudgetHistorySchema } from './budget-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BudgetHistory.name,
        schema: BudgetHistorySchema,
      },
    ]),
  ],
  controllers: [BudgetHistoryController],
  providers: [BudgetHistoryService],
})
export class BudgetHistoryModule {}
