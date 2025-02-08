import { GeneralResponse } from '@/response.interface';

export interface OneTimePaymentResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    paymentUrl: string;
  };
}
