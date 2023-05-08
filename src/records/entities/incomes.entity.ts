import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AccountRecord } from './records.entity';
import { Expense } from './expenses.entity';

@Schema()
export class Income extends AccountRecord {
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: Expense.name,
      },
    ],
  })
  expensesPaid: Types.Array<Expense>;
}

export const IncomeSchema = SchemaFactory.createForClass(Income);
