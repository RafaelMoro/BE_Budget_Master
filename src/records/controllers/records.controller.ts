import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Delete,
  Request,
} from '@nestjs/common';

import { DeleteRecordDto } from '../dtos/records.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/incomes.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecordsService } from '../services/records.service';
import { Param } from '@nestjs/common/decorators';
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post('/expenses')
  createExpense(@Body() payload: CreateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.recordsService.createOneRecord(payload, false, userId);
  }

  @Post('/incomes')
  createIncome(@Body() payload: CreateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.recordsService.createOneRecord(payload, true, userId);
  }

  @Get('/incomes/:accountId')
  findIncomeByAccount(@Param('accountId') accountId: string) {
    return this.recordsService.findRecordsByAccount({
      accountId,
      isIncome: true,
    });
  }

  @Get('/expenses/:accountId')
  findExpenseByAccount(@Param('accountId') accountId: string) {
    return this.recordsService.findRecordsByAccount({ accountId });
  }

  // This endpoint is used to search for expenses to be related to an income.
  @Get('/expenses/:accountId/:month/:year')
  findExpensesByAccountMonthAndYear(
    @Param('accountId') accountId: string,
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.recordsService.findAllExpensesByMonthAndYear(
      accountId,
      month,
      year,
    );
  }

  @Get('/expenses-and-incomes/:accountId')
  findExpenseAndIncomesByAccount(@Param('accountId') accountId: string) {
    return this.recordsService.findAllIncomesAndExpenses(accountId);
  }

  @Get('/expenses-and-incomes/:accountId/:month/:year')
  findAllIncomesAndExpensesByAccountAndMonth(
    @Param('accountId') accountId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.recordsService.findAllIncomesAndExpensesByMonthAndYear(
      accountId,
      month,
      year,
      userId,
    );
  }

  @Put('/expenses')
  updateExpense(@Body() payload: UpdateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.recordsService.updateRecord(payload, false, userId);
  }

  @Put('/incomes')
  updateIncome(@Body() payload: UpdateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.recordsService.updateRecord(payload, true, userId);
  }

  @Delete('/expenses')
  removeExpense(@Body() payload: DeleteRecordDto) {
    return this.recordsService.removeRecord(payload);
  }

  @Delete('/incomes')
  removeIncome(@Body() payload: DeleteRecordDto) {
    return this.recordsService.removeRecord(payload, true);
  }

  @Post('/expenses/multiple')
  createMultipleExpenses(@Body() payload: CreateExpenseDto[]) {
    return this.recordsService.createMultipleRecords(payload);
  }

  @Post('/incomes/multiple')
  createMultiple(@Body() payload: CreateIncomeDto[]) {
    return this.recordsService.createMultipleRecords(payload, true);
  }

  @Delete('/expenses/multiple')
  deleteMultipleExpenses(@Body() payload: DeleteRecordDto[]) {
    return this.recordsService.deleteMultipleRecords(payload);
  }

  @Delete('/incomes/multiple')
  deleteMultipleIncomes(@Body() payload: DeleteRecordDto[]) {
    return this.recordsService.deleteMultipleRecords(payload, true);
  }

  @Put('/expenses/multiple')
  updateMultipleExpenses(@Body() payload: UpdateExpenseDto[]) {
    return this.recordsService.updateMultipleRecords(payload);
  }

  @Put('/incomes/multiple')
  updateMultipleIcomes(@Body() payload: UpdateIncomeDto[]) {
    return this.recordsService.updateMultipleRecords(payload, true);
  }
}
