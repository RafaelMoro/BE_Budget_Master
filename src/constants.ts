import { GeneralResponse } from './response.interface';

export const VERSION_RESPONSE = process.env.npm_package_version;
export const ENVIRONMENT_PRODUCTION = 'production';

export const INITIAL_RESPONSE: GeneralResponse = {
  version: VERSION_RESPONSE,
  success: true,
  message: null,
  data: null,
  error: null,
};

/** MESSAGED */
export const USER_EXISTS_ERROR = 'Try with other email.';
