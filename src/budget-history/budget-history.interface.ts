import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { BudgetHistory } from './budget-history.entity';

export interface BudgetHistoryResponse extends BudgetHistory {
  _id: Types.ObjectId;
}

export interface SingleBudgetHistoryResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    budgetHistory: BudgetHistoryResponse;
  };
}

export interface GeneralBudgetHistoryResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    budgetsHistory: BudgetHistoryResponse[];
  };
}
