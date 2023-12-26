import { Types } from 'mongoose';
import { CreateExpense } from './entities/expenses.entity';
import { DeleteRecordDto } from './dtos/records.dto';
import { CreateIncome } from './entities/incomes.entity';
import { GeneralResponse } from 'src/response.interface';

export interface ExpenseResponse extends Omit<CreateExpense, 'category'> {
  _id: Types.ObjectId;
}

export interface IncomeResponse extends Omit<CreateIncome, 'category'> {
  _id: Types.ObjectId;
}

export interface DeleteRecordResponse {
  message: string | null;
  error: null | string;
  deleteRecordSuccess: boolean;
}

export interface FindAllNotPaidExpensesByMonthResponse {
  message: null | string;
  expenses: ExpenseResponse[];
}

/** Interfaces of services */
export interface FindRecordsByAccountProps {
  accountId: string;
  userId: string;
  isIncome?: boolean;
}

export interface RemoveRecordProps {
  payload: DeleteRecordDto;
  userId: string;
  isIncome?: boolean;
}

export interface SingleRecordResponse extends Omit<GeneralResponse, 'data'> {
  data: ExpenseResponse | IncomeResponse;
}

export interface RecordCreated extends Omit<GeneralResponse, 'category'> {
  // Returns record with all category information instead of returning just category id.
  data: object;
}
