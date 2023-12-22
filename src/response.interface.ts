export interface GeneralResponse {
  version: string;
  success: boolean;
  data: unknown;
  message: string;
  error: string | object;
}
