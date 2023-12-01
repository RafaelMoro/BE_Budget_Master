import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountRecord } from './records.entity';
import { Types } from 'mongoose';

@Schema()
export class CreateExpense extends AccountRecord {
  @Prop({ required: true })
  isPaid: boolean;
}

export interface Expense extends CreateExpense {
  _id: Types.ObjectId;
}

export type ExpenseWithoutUserId = Omit<Expense, 'userId'>;

export const ExpenseSchema = SchemaFactory.createForClass(CreateExpense);
