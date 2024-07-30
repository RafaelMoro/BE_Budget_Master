import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { AccountRecord } from '@domain/records/entities/records.entity';
import { BudgetModel } from '../../budgets/budgets.entity';

@Schema()
export class CreateExpense extends AccountRecord {
  @Prop({ required: true })
  isPaid: boolean;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: BudgetModel.name,
      },
    ],
  })
  linkedBudgets: Types.Array<BudgetModel>;
}

export interface Expense extends CreateExpense {
  _id: Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(CreateExpense);
