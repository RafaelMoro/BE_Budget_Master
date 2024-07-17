import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BudgetModel } from '../budgets/budgets.entity';

@Schema()
export class BudgetHistoryModel extends Document {
  @Prop({ type: Types.ObjectId, ref: BudgetModel.name, required: true })
  budget: BudgetModel | Types.ObjectId;

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

export const BudgetHistorySchema =
  SchemaFactory.createForClass(BudgetHistoryModel);
