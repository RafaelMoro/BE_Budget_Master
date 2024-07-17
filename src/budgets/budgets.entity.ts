import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BudgetModel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  typeBudget: string;

  @Prop({ required: true })
  sub: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ required: true })
  currentAmount: number;

  @Prop({ required: true })
  limit: number;

  @Prop()
  period: string;

  @Prop()
  isActive: boolean;

  @Prop({ type: Date })
  nestResetDate: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(BudgetModel);
