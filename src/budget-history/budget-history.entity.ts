import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Budget } from '../budgets/budgets.entity';

@Schema()
export class BudgetHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: Budget.name, required: true })
  budget: Budget | Types.ObjectId;

  @Prop({ required: true })
  sub: string;

  @Prop({
    type: [
      {
        recordId: { type: String },
        recordName: { type: String },
        recordAmount: { type: Number },
        recordDate: { type: Date },
        budgetCurrentAmount: { type: Number },
        budgetUpdatedAmount: { type: Number },
      },
    ],
  })
  records: Types.Array<Record<'string | date | number', any>>;
}

export const BudgetHistorySchema = SchemaFactory.createForClass(BudgetHistory);
