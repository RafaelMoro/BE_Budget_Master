import { GeneralResponse } from 'src/response.interface';
import { Income } from './incomes.entity';
import { DeleteIncomeDto, UpdateIncomeDto } from './incomes.dto';

export interface ResponseSingleIncome
  extends Omit<GeneralResponse, 'data' | 'message'> {
  message: string[];
  data: {
    income: Income;
  };
}

export interface BatchIncomesResponse extends Omit<GeneralResponse, 'data'> {
  data: (Income | string)[];
}

export interface FindIncomesByMonthYearProps {
  accountId: string;
  month: string;
  year: string;
  userId: string;
}

export interface FindAllIncomesByAccountResponse {
  incomes: Income[];
  message: string | null;
}

export interface DeleteMultipleIncomesResponse {
  incomes: (Income | string)[];
}

export interface UpdateIncomeProps {
  changes: UpdateIncomeDto;
  userId: string;
  skipFindCategory?: boolean;
  skipUpdateExpensesPaid?: boolean;
}

export interface RemoveIncomeProps {
  payload: DeleteIncomeDto;
  userId: string;
  isIncome?: boolean;
}
