import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../entities/records.entity';
import {
  CreateRecordDto,
  UpdateRecordDto,
  DeleteMultipleRecordsDto,
} from '../dtos/records.dto';

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

  async createMultipleRecords(data: CreateRecordDto[]) {
    try {
      const newModels = data.map((account) => {
        return new this.recordModel(account);
      });
      const savedModels = await Promise.all(
        newModels.map((account) => account.save()),
      );
      return savedModels;
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

  async update(id: string, changes: UpdateRecordDto) {
    try {
      const updatedRecord = await this.recordModel
        .findByIdAndUpdate(id, { $set: changes }, { new: true })
        .exec();
      return updatedRecord;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    try {
      const recordDeleted = await this.recordModel.findByIdAndDelete(id);
      return recordDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMultipleRecords(records: DeleteMultipleRecordsDto[]) {
    try {
      const recordsIds = records.map((record) => record.record);
      const deletedRecords = await Promise.all(
        recordsIds.map((id) => this.recordModel.findByIdAndDelete(id)),
      );
      return deletedRecords;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
