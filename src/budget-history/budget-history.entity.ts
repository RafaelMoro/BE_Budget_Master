import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Budget } from '../budgets/entities/budgets.entity';

@Schema()
export class BudgetHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: Budget.name, required: true })
  budgetId: Budget | Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  budgetName: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({
    type: [
      {
        recordId: { type: String },
        recordName: { type: String },
        recordDate: { type: Date },
        budgetCurrentAmount: { type: Number },
        budgetUpdatedAmount: { type: Number },
      },
    ],
  })
  records: Types.Array<Record<'string | date | number', any>>;
}

export const BudgetHistorySchema = SchemaFactory.createForClass(BudgetHistory);
