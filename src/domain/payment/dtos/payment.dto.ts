import { IsString, IsNotEmpty } from 'class-validator';

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  readonly payment: string;
}
