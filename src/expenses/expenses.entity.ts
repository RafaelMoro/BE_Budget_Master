import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountRecord } from '../records/entities/records.entity';
import { Types } from 'mongoose';
import { Budget } from '../budgets/budgets.entity';

@Schema()
export class CreateExpense extends AccountRecord {
  @Prop({ required: true })
  isPaid: boolean;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: Budget.name,
      },
    ],
  })
  linkedBudgets: Types.Array<Budget>;
}

export interface Expense extends CreateExpense {
  _id: Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(CreateExpense);
