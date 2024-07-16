import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { BudgetHistoryModel } from './budget-history.entity';
import { RecordsHistory } from './budget-history.dto';

export interface BudgetHistoryResponse extends BudgetHistoryModel {
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

export interface RemoveBudgetHistoryByBudgetIdResponse {
  budgetHistory: BudgetHistoryResponse;
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
