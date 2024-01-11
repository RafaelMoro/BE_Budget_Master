import { VERSION_RESPONSE } from '../../constants';
import { GeneralResponse } from '../../response.interface';

export const EXPENSE_NOT_FOUND = 'No expense found with that account id';
export const INCOME_NOT_FOUND = 'No income found with that account id';
export const CATEGORY_ID_ERROR = 'Mongo Id does not belong to a category';
export const RECORD_CREATED_MESSAGE = 'Record created';
export const RECORD_NOT_FOUND = 'Record not found.';
export const NO_EXPENSES_INCOMES_FOUND = 'No incomes or expenses found.';
export const NO_EXPENSES_FOUND = 'No expenses found.';
export const NO_INCOMES_FOUND = 'No incomes found.';
export const MISSING_DATE = 'date prop is missing.';
export const MISSING_CATEGORY = 'category prop is missing.';
export const MISSING_AMOUNT = 'amount prop is missing.';
export const UNAUTHORIZED_EXPENSES_ERROR =
  "You're unauthorized to see these expenses.";
export const UNAUTHORIZED_INCOMES_ERROR =
  "You're unauthorized to see these incomes.";
export const RECORD_UNAUTHORIZED_ERROR =
  'This record does not belongs to the user';

export const INITIAL_RESPONSE: GeneralResponse = {
  version: VERSION_RESPONSE,
  success: true,
  message: null,
  data: null,
  error: null,
};
