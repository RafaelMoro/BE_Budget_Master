import { Module } from '@nestjs/common';
import { IncomesController } from './controllers/incomes.controller';
import { IncomesService } from './services/incomes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateIncome, IncomeSchema } from './incomes.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreateIncome.name,
        schema: IncomeSchema,
      },
    ]),
  ],
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService],
})
export class IncomesModule {}
