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

export interface Income extends CreateIncome {
  _id: Types.ObjectId;
}

export type IncomeWithoutUserId = Omit<Income, 'userId'>;

export const IncomeSchema = SchemaFactory.createForClass(CreateIncome);
