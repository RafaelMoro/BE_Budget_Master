import { GeneralResponse } from 'src/response.interface';
import { Income } from './incomes.entity';
import { UpdateIncomeDto } from './incomes.dto';

export interface ResponseSingleIncome extends Omit<GeneralResponse, 'data'> {
  data: {
    income: Income;
  };
}

export interface BatchIncomesResponse extends Omit<GeneralResponse, 'data'> {
  data: (Income | string)[];
}

export interface UpdateIncomeProps {
  changes: UpdateIncomeDto;
  userId: string;
  skipFindCategory?: boolean;
  skipUpdateExpensesPaid?: boolean;
}
