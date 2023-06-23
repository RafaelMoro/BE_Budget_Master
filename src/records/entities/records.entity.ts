import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Account } from '../../accounts/entities/accounts.entity';

@Schema()
export class AccountRecord extends Document {
  @Prop({ required: true })
  shortName: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  fullDate: string;

  @Prop({ required: true })
  formattedTime: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  subCategory: string;

  @Prop()
  tag: string[];

  @Prop({
    type: [
      {
        name: { type: String },
        amount: { type: Number },
        amountPaid: { type: Number },
        isPaid: { type: Boolean },
      },
    ],
  })
  indebtedPeople: Types.Array<Record<'string | boolean | number', any>>;

  @Prop({ type: Types.ObjectId, ref: Account.name, required: true })
  account: Account | Types.ObjectId;

  @Prop()
  budgets: string[];
}

export const RecordsSchema = SchemaFactory.createForClass(AccountRecord);
