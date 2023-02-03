import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Account extends Document {
  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  accountType: string;
}

export const AccountsSchema = SchemaFactory.createForClass(Account);
