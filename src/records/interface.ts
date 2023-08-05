import { Types } from 'mongoose';
import { Expense } from './entities/expenses.entity';

export interface CreateOrModifyCategoryForRecordResponse {
  message: null | string;
  categoryId: string;
}

export interface FindAllNotPaidExpensesByMonthResponse {
  message: null | string;
  expenses: Omit<
    Expense & {
      _id: Types.ObjectId;
    },
    never
  >[];
}
