import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';

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

  @Post('/expenses/multiple')
  createMultipleExpenses(@Body() payload: CreateExpenseDto[]) {
    return this.recordsService.createMultipleRecords(payload);
  }

  @Post('/incomes/multiple')
  createMultiple(@Body() payload: CreateIncomeDto[]) {
    return this.recordsService.createMultipleRecords(payload, true);
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
