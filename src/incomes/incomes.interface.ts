import { GeneralResponse } from 'src/response.interface';
import { Income } from './incomes.entity';

export interface IncomeCreated extends Omit<GeneralResponse, 'category'> {
  data: {
    income: Income;
  };
}

export interface BatchIncomesResponse extends Omit<GeneralResponse, 'data'> {
  data: (Income | string)[];
}
