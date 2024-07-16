import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { Budget } from './budgets.entity';
import { BudgetHistory } from '../budget-history/budget-history.interface';

export interface BudgetsResponse extends Budget {
  _id: Types.ObjectId;
}

export interface SingleBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: BudgetsResponse;
  };
}

export interface RemoveBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: BudgetsResponse;
    budgetHistoryDeleted: BudgetHistory;
  };
}

export interface CreateBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: BudgetsResponse;
    budgetHistory: BudgetHistory;
  };
}

export interface GeneralBudgetsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budgets: BudgetsResponse[];
  };
}

export type TypeBudget = 'periodic' | 'one-time';
