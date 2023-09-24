import { Types } from 'mongoose';
import { Expense } from './entities/expenses.entity';

export interface CreateOrModifyCategoryForRecordResponse {
  message: null | string;
  categoryId: string;
}

export interface DeleteRecordResponse {
  message: string | null;
  error: null | string;
  deleteRecordSuccess: boolean;
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
