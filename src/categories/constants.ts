import { LocalCategories } from './interface';

export const SUBCATEGORY_CREATED_SUCCESS = 'Subcategory created';
export const SUBCATEGORY_ERROR = 'Subcategory already exists';
export const CATEGORY_EXISTS_MESSAGE = 'Category found. ';
export const CATEGORY_DELETED_MESSAGE = 'Category deleted';
export const CATEGORY_NOT_FOUND_ERROR = 'Category not found';
export const CATEGORY_CREATED_MESSAGE = 'New category created';

export const LOCAL_CATEGORIES: LocalCategories = {
  foodAndDrink: 'Food and Drink',
  house: 'Housing',
  utilities: 'Utilities',
  subcriptions: 'Subscriptions',
  transportation: 'Transportation',
  financialExpenses: 'Financial Expenses',
  healthCare: 'Health and Personal Care',
  kids: 'Kids',
  shopping: 'Shopping',
  entertainment: 'Entertainment and Leisure',
  savings: 'Savings',
};
