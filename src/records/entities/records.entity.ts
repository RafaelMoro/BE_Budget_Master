import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Record extends Document {
  @Prop({ required: true })
  shortName: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  subCategory: string;

  @Prop()
  tag: string[];

  @Prop()
  peopleDebt: string[];

  @Prop({ required: true })
  account: string;

  @Prop()
  budget: string[];
}
