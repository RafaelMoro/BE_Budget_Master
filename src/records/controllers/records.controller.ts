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

  @Get()
  findByAccount(@Body() payload: GetRecordsByAccountDto) {
    const { account } = payload;
    return this.recordsService.findByAccount(account);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRecordDto) {
    return this.recordsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
