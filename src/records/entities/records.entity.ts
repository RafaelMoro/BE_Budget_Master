import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Account } from '../../accounts/entities/accounts.entity';
import { Category } from '../../categories/entities/categories.entity';

@Schema()
export class AccountRecord extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  shortName: string;

  @Prop({ required: true })
  typeOfRecord: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  amountFormatted: string;

  @Prop({ type: Date })
  date: Date;

  @Prop({ required: true })
  fullDate: string;

  @Prop({ required: true })
  formattedTime: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category: Category | Types.ObjectId;

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

  @Prop(
    raw({
      transferId: { type: String },
      account: { type: String },
    }),
  )
  transferRecord: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: Account.name, required: true })
  account: Account | Types.ObjectId;

  @Prop()
  budgets: string[];

  @Prop()
  transferId: string;
}

export const RecordsSchema = SchemaFactory.createForClass(AccountRecord);
