import { IsString, IsNotEmpty, IsMongoId, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CardProvider } from '../accounts.interface';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly alias: string;

  @IsString()
  @IsNotEmpty()
  readonly accountType: string;

  @IsString()
  @IsNotEmpty()
  readonly accountProvider: CardProvider;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @IsNumber()
  @IsNotEmpty()
  readonly terminationFourDigits: number;

  @IsString()
  @IsNotEmpty()
  readonly backgroundColor: string;

  @IsString()
  @IsNotEmpty()
  readonly color: string;
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
