import { Controller, Post, Body, Get } from '@nestjs/common';
import { CreateRecordDto, GetRecordsByAccountDto } from '../dtos/records.dto';
import { RecordsService } from '../services/records.service';

@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post()
  create(@Body() payload: CreateRecordDto) {
    return this.recordsService.createOne(payload);
  }

  @Get()
  findByAccount(@Body() payload: GetRecordsByAccountDto) {
    const { account } = payload;
    return this.recordsService.findByAccount(account);
  }
}
