import { Expense } from './entities/expenses.entity';
import { DeleteRecordDto } from './dtos/records.dto';
import { GeneralResponse } from 'src/response.interface';
import { Income } from './entities/incomes.entity';

export interface ExpensesPaidFormatted {
  _id: string;
  shortName: string;
  amount: number;
  fullDate: string;
  formattedTime: string;
}

export interface FormattedIncomes extends Omit<Income, 'expensesPaid'> {
  expensesPaid: ExpensesPaidFormatted[];
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
  data: Expense | Income;
}

export interface MultipleRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: Expense[] | Income[] | FormattedIncomes[] | null;
}

export interface RecordCreated extends Omit<GeneralResponse, 'category'> {
  // Returns record with category information with id and category name.
  data: {
    record: object;
  };
}

export interface JoinRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: (Expense | Income | FormattedIncomes)[];
}

export interface BatchRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: (Expense | Income | string)[];
}
