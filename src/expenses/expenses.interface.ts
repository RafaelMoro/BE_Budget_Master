import { GeneralResponse } from '../response.interface';
import { Expense } from './expenses.entity';

export interface ExpenseCreated extends Omit<GeneralResponse, 'category'> {
  data: {
    expense: Expense;
  };
}
