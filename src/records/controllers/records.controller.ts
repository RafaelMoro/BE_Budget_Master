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
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../expenses/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../../incomes/incomes.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecordsService } from '../services/records.service';
import { Param } from '@nestjs/common/decorators';
import { CreateTransferDto } from '../dtos/transfer.dto';
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post('/transfer')
  createTransfer(@Body() payload: CreateTransferDto, @Request() req) {
    const { expense, income } = payload;
    const userId = req.user.sub;
    return this.recordsService.createTransfer({ expense, income, userId });
  }

  // This endpoint is used to search for expenses to be related to an income.
  @Get('/expenses/:accountId/:month/:year')
  findExpensesByAccountMonthAndYear(
    @Param('accountId') accountId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.recordsService.findAllExpensesByMonthAndYear(
      accountId,
      month,
      year,
      userId,
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

  @Get('/transfer/:transferId/:month/:year')
  findTransferRecordsByMonthAndYear(
    @Param('transferId') transferId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.recordsService.findTransferRecordsByMonthAndYear({
      month,
      year,
      userId,
      transferId,
    });
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
