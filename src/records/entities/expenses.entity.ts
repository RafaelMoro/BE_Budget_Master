import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountRecord } from './records.entity';

@Schema()
export class Expense extends AccountRecord {
  @Prop({ required: true })
  isPayed: boolean;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
