import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountRecord } from './records.entity';

@Schema()
export class CreateExpense extends AccountRecord {
  @Prop({ required: true })
  isPaid: boolean;
}

export const ExpenseSchema = SchemaFactory.createForClass(CreateExpense);
