import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';

import {
  CreateRecordDto,
  DeleteRecordDto,
  GetRecordsByAccountDto,
  UpdateRecordDto,
} from '../dtos/records.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecordsService } from '../services/records.service';
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

  @Get()
  findByAccount(@Body() payload: GetRecordsByAccountDto) {
    const { accountId } = payload;
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
