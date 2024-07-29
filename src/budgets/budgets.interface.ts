import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { BudgetModel } from './budgets.entity';
import { BudgetHistory } from '../budget-history/budget-history.interface';

export type ExpenseOperation = 'removeExpense' | 'addExpense';

export interface Budget extends BudgetModel {
  _id: Types.ObjectId;
}

export interface SingleBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: Budget;
  };
}

export interface RemoveBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: Budget;
    budgetHistoryDeleted: BudgetHistory;
  };
}

export interface CreateBudgetResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budget: Budget;
    budgetHistory: BudgetHistory;
  };
}

export interface UpdateAmountBudgetResponse {
  oldBudget: Budget;
  updatedBudget: Budget;
  message: string | null;
}

export interface GeneralBudgetsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    budgets: Budget[];
  };
}

export type TypeBudget = 'periodic' | 'one-time';
