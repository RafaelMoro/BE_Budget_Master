import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../entities/records.entity';
import { CreateRecordDto } from '../dtos/records.dto';

@Injectable()
export class RecordsService {
  constructor(@InjectModel(Record.name) private recordModel: Model<Record>) {}

  create(data: CreateRecordDto) {
    const newModel = new this.recordModel(data);
    return newModel.save();
  }
}
