import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Budget extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  currentAmount: number;

  @Prop({ required: true })
  limit: number;

  @Prop({ required: true })
  period: string;

  @Prop({ required: true })
  isActive: boolean;

  @Prop({ required: true })
  nestResetDate: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
