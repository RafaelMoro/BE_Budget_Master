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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecordsService } from '../services/records.service';
import { Param } from '@nestjs/common/decorators';
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

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
