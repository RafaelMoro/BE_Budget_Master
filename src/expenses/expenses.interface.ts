import { GeneralResponse } from '../response.interface';
import { DeleteExpenseDto, UpdateExpenseDto } from './expenses.dto';
import { Expense } from './expenses.entity';

export interface ResponseSingleExpense
  extends Omit<GeneralResponse, 'data' | 'message'> {
  data: {
    expense: Expense;
  };
  message: string[];
}

export interface ResponseMultipleExpenses
  extends Omit<GeneralResponse, 'data'> {
  data: {
    expenses: Expense[];
  };
}

export interface BatchExpensesResponse extends Omit<GeneralResponse, 'data'> {
  data: (Expense | string)[];
}

export interface FindExpensesByMonthYearProps {
  accountId: string;
  month: string;
  year: string;
  userId: string;
}

export interface FindAllExpensesByAccountResponse {
  expenses: Expense[];
  message: string | null;
}

export interface DeleteMultipleExpensesResponse {
  expenses: (Expense | string)[];
}

export interface UpdateExpenseProps {
  changes: UpdateExpenseDto;
  userIdGotten: string;
}

export interface ExpensePaidStatus {
  wasFound: boolean;
  recordId: string;
  recordName: string;
}

export interface UpdateMultipleExpensesPaidStatusResponse {
  recordsNotUpdated: ExpensePaidStatus[];
  recordsUpdated: ExpensePaidStatus[];
}

export interface RemoveExpenseProps {
  payload: DeleteExpenseDto;
  userId: string;
  isIncome?: boolean;
}
