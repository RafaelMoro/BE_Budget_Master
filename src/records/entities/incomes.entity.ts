import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountRecord } from './records.entity';

@Schema()
export class Income extends AccountRecord {
  @Prop({ required: true })
  amountPayed: boolean;
}

export const IncomeSchema = SchemaFactory.createForClass(Income);
