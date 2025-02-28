import { IsString, IsNotEmpty } from 'class-validator';

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  readonly payment: string;
}

export class PortalDto {
  @IsString()
  readonly sessionId: string;

  @IsString()
  readonly customerId: string;
}
