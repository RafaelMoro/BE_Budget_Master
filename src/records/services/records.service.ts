import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../entities/records.entity';
import { CreateRecordDto } from '../dtos/records.dto';

@Injectable()
export class RecordsService {
  constructor(@InjectModel(Record.name) private recordModel: Model<Record>) {}

  async createOne(data: CreateRecordDto) {
    try {
      const newModel = new this.recordModel(data);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByAccount(accountId: string) {
    try {
      const records = await this.recordModel
        .find({ account: accountId })
        .exec();
      return records;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
