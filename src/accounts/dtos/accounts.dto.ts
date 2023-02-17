import { IsString, IsNotEmpty, IsMongoId, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly accountType: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @IsString()
  @IsNotEmpty()
  readonly backgroundColor: string;

  // sub is the user id.
  @IsNotEmpty()
  @IsMongoId()
  readonly sub: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly accountId: string;
}

export class DeleteAccountDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly accountId: string;
}
