import { GeneralResponse } from '../response.interface';
import { DeleteExpenseDto, UpdateExpenseDto } from './expenses.dto';
import { Expense } from './expenses.entity';

export interface ResponseSingleExpense extends Omit<GeneralResponse, 'data'> {
  data: {
    expense: Expense;
  };
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

export interface FindAllExpensesByAccountResponse {
  expenses: Expense[];
  message: string | null;
}

export interface DeleteMultipleExpensesResponse {
  expenses: (Expense | string)[];
}

export interface UpdateExpenseProps {
  changes: UpdateExpenseDto;
  userId: string;
  skipFindCategory?: boolean;
}

export interface RemoveExpenseProps {
  payload: DeleteExpenseDto;
  userId: string;
  isIncome?: boolean;
}
