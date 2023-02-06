import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsDate,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  readonly shortName: string;

  @IsString()
  readonly description: string;

  @IsNumber()
  @IsNotEmpty()
  readonly price: number;

  @IsDate()
  @IsNotEmpty()
  readonly date: Date;

  @IsString()
  @IsNotEmpty()
  readonly category: string;

  @IsString()
  @IsNotEmpty()
  readonly subCategory: string;

  @IsArray()
  readonly tag: string[];

  @IsArray()
  readonly peopleDebt: string[];

  @IsString()
  @IsNotEmpty()
  readonly account: string;

  @IsString()
  readonly budget: string;
}

export class UpdateRecordDto extends PartialType(CreateRecordDto) {}
