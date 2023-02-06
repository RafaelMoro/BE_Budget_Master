import { Controller, Post, Body } from '@nestjs/common';
import { CreateRecordDto } from '../dtos/records.dto';
import { RecordsService } from '../services/records.service';

@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post()
  create(@Body() payload: CreateRecordDto) {
    return this.recordsService.create(payload);
  }
}
