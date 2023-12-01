import { Types } from 'mongoose';
import { CreateExpense } from './entities/expenses.entity';

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
    CreateExpense & {
      _id: Types.ObjectId;
    },
    never
  >[];
}

/** Interfaces of services */
export interface FindRecordsByAccountProps {
  accountId: string;
  userId: string;
  isIncome?: boolean;
}
