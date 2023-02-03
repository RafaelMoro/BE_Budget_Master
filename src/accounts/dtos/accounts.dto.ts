import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  readonly accountName: string;

  @IsString()
  @IsNotEmpty()
  readonly accountType: string;

  @IsNotEmpty()
  @IsMongoId()
  readonly user: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
