import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { BudgetHistoryModel } from './budget-history.entity';
import { RecordsHistory } from './budget-history.dto';

export interface BudgetHistory extends BudgetHistoryModel {
  _id: Types.ObjectId;
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
  budgetId: Types.ObjectId;
}

export interface RemoveRecordFromBudgetHistoryProps {
  recordToBeDeleted: string;
  sub: string;
  budgetHistoryId: Types.ObjectId;
}
