import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AccountRecord } from '../entities/records.entity';
import { RECORDS_NOT_FOUND } from '../constants';
import {
  CreateRecordDto,
  UpdateRecordDto,
  DeleteRecordDto,
} from '../dtos/records.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(AccountRecord.name) private recordModel: Model<AccountRecord>,
  ) {}

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
      if (records.length === 0) {
        // returning a message because this service is used when an account is deleted. If no records are found and an exception is throwed,
        // it would break the service to delete an account with no records.
        return RECORDS_NOT_FOUND;
      }
      return records;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(changes: UpdateRecordDto) {
    try {
      const { recordId } = changes;
      const updatedRecord = await this.recordModel
        .findByIdAndUpdate(recordId, { $set: changes }, { new: true })
        .exec();
      if (!updatedRecord) throw new BadRequestException('Record not found');
      return updatedRecord;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateMultipleRecords(changes: UpdateRecordDto[]) {
    try {
      const updatedRecords = await Promise.all(
        changes.map((change) =>
          this.recordModel.findByIdAndUpdate(
            change.recordId,
            { $set: change },
            { new: true },
          ),
        ),
      );
      const checkUpdatedRecords = updatedRecords.map((record, index) => {
        if (!record) return `record id ${changes[index].recordId} not found`;
        return record;
      });
      return checkUpdatedRecords;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(payload: DeleteRecordDto) {
    try {
      const { recordId } = payload;
      const recordDeleted = await this.recordModel.findByIdAndDelete(recordId);
      if (!recordDeleted) throw new BadRequestException('Record not found');
      return recordDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMultipleRecords(records: DeleteRecordDto[]) {
    try {
      const recordsIds = records.map((record) => record.recordId);
      const deletedRecords = await Promise.all(
        recordsIds.map((id) => this.recordModel.findByIdAndDelete(id)),
      );
      const checkDeletedRecords = deletedRecords.map((record, index) => {
        if (!record) return `record id ${records[index].recordId} not found`;
        return record;
      });
      return checkDeletedRecords;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
