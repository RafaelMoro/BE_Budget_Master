import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { TypeBudget } from '../budgets.interface';
import { Type } from 'class-transformer';

export class CreateBudgetsDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  readonly typeBudget: TypeBudget;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly endDate: Date;

  @IsNumber()
  @IsNotEmpty()
  readonly currentAmount: number;

  @IsNumber()
  @IsNotEmpty()
  readonly limit: number;

  // daily, weekly, monthly, yearly, bi-weekly, bi-monthly, XMonths, XWeeks, XDays
  @IsString()
  readonly period: string;

  @IsBoolean()
  readonly isActive: boolean;

  @IsDate()
  @Type(() => Date)
  readonly nextResetDate: Date;

  // Format "DD:MM:YYYY | DD:MM:YYYY"
  @IsArray()
  readonly previousPeriods: string[];
}
