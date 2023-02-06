import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  readonly accountName: string;

  @IsString()
  @IsNotEmpty()
  readonly accountType: string;

  // sub is the user id.
  @IsNotEmpty()
  @IsMongoId()
  readonly sub: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

export class GetAccountsByUserDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly sub: string;
}