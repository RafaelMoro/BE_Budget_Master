import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Delete,
} from '@nestjs/common';

import {
  CreateRecordDto,
  DeleteRecordDto,
  UpdateRecordDto,
} from '../dtos/records.dto';
import { CreateExpenseDto } from '../dtos/expenses.dto';
import { CreateIncomeDto } from '../dtos/incomes.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecordsService } from '../services/records.service';
import { Param } from '@nestjs/common/decorators';
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post('/expense')
  createExpense(@Body() payload: CreateExpenseDto) {
    return this.recordsService.createOneExpense(payload);
  }

  @Post('/income')
  createIncome(@Body() payload: CreateIncomeDto) {
    return this.recordsService.createOneIncome(payload);
  }

  @Post()
  create(@Body() payload: CreateRecordDto) {
    return this.recordsService.createOne(payload);
  }

  @Post('/multiple')
  createMultiple(@Body() payload: CreateRecordDto[]) {
    return this.recordsService.createMultipleRecords(payload);
  }

  @Get(':accountId')
  findByAccount(@Param('accountId') accountId: string) {
    return this.recordsService.findByAccount(accountId);
  }

  @Delete('/multiple')
  deleteMultiple(@Body() payload: DeleteRecordDto[]) {
    return this.recordsService.deleteMultipleRecords(payload);
  }

  @Put('/multiple')
  updateMultiple(@Body() payload: UpdateRecordDto[]) {
    return this.recordsService.updateMultipleRecords(payload);
  }

  @Put()
  update(@Body() payload: UpdateRecordDto) {
    return this.recordsService.update(payload);
  }

  @Delete()
  remove(@Body() payload: DeleteRecordDto) {
    return this.recordsService.remove(payload);
  }
}
