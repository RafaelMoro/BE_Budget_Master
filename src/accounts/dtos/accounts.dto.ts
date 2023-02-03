import { IsString, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  readonly accountName: string;

  @IsString()
  @IsNotEmpty()
  readonly accountType: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
