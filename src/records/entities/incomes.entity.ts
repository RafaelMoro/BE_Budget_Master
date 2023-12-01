import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AccountRecord } from './records.entity';
import { CreateExpense } from './expenses.entity';

@Schema()
export class CreateIncome extends AccountRecord {
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: CreateExpense.name,
      },
    ],
  })
  expensesPaid: Types.Array<CreateExpense>;
}

export const IncomeSchema = SchemaFactory.createForClass(CreateIncome);
