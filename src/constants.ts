import { GeneralResponse } from './response.interface';

export const VERSION_RESPONSE = process.env.npm_package_version;
export const ENVIRONMENT_PRODUCTION = 'production';
export const PROD_URI = 'https://app.budget-master.space';

export const INITIAL_RESPONSE: GeneralResponse = {
  version: VERSION_RESPONSE,
  success: true,
  message: null,
  data: null,
  error: null,
};

export type TypeOfRecord = 'expense' | 'income' | 'transfer';

/** MESSAGED */
export const USER_EXISTS_ERROR = 'Try with other email.';
