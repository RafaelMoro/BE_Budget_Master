import { GeneralResponse } from '../response.interface';
import { BudgetHistoryModel } from './budget-history.entity';
import { RecordsHistory } from './budget-history.dto';

export interface BudgetHistory extends BudgetHistoryModel {
  _id: unknown
}

export interface SingleBudgetHistoryResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    budgetHistory: BudgetHistory;
  };
}

export interface GeneralBudgetHistoryResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    budgetsHistory: BudgetHistory[];
  };
}

export interface RemoveBudgetHistoryByBudgetIdResponse {
  budgetHistory: BudgetHistory;
  message: string;
}

export interface AddRecordToBudgetHistoryProps {
  newRecord: RecordsHistory;
  sub: string;
  budgetId: unknown;
}

export interface RemoveRecordFromBudgetHistoryProps {
  recordToBeDeleted: string;
  sub: string;
  budgetId: unknown;
}
