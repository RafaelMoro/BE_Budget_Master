import { Types } from 'mongoose';
import { CreateExpense } from './entities/expenses.entity';
import { DeleteRecordDto } from './dtos/records.dto';
import { CreateIncome } from './entities/incomes.entity';
import { GeneralResponse } from 'src/response.interface';

export interface ExpenseResponse extends CreateExpense {
  _id: Types.ObjectId;
}

export interface IncomeResponse extends CreateIncome {
  _id: Types.ObjectId;
}

export interface ExpensesPaidFormatted {
  _id: string;
  shortName: string;
  amount: number;
  fullDate: string;
  formattedTime: string;
}

export interface FormattedIncomes extends Omit<IncomeResponse, 'expensesPaid'> {
  expensesPaid: ExpensesPaidFormatted[];
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

export interface MultipleRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: ExpenseResponse[] | IncomeResponse[] | FormattedIncomes[] | null;
}

export interface RecordCreated extends Omit<GeneralResponse, 'category'> {
  // Returns record with category information with id and category name.
  data: object;
}
