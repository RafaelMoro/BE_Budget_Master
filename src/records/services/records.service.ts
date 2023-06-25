import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AccountRecord } from '../entities/records.entity';
import { Expense } from '../entities/expenses.entity';
import { Income } from '../entities/incomes.entity';
import { EXPENSE_NOT_FOUND, INCOME_NOT_FOUND } from '../constants';
import { DeleteRecordDto } from '../dtos/records.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/incomes.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(AccountRecord.name) private recordModel: Model<AccountRecord>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Income.name) private incomeModel: Model<Income>,
  ) {}

  async createOneRecord(
    data: CreateExpenseDto | CreateIncomeDto,
    isIncome = false,
  ) {
    try {
      const newModel = !isIncome
        ? new this.expenseModel(data)
        : new this.incomeModel(data);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findRecordsByAccount(accountId: string, isIncome = false) {
    try {
      const records = !isIncome
        ? await this.expenseModel.find({ account: accountId }).exec()
        : await this.incomeModel
            .find({ account: accountId })
            .populate('expensesPaid')
            .exec();

      if (isIncome && records.length > 0) {
        // Check if the any record has any expenses paid linked.
        const noExpensesPaid = records.some(
          (record) => record.expensesPaid.length > 0,
        );
        if (noExpensesPaid) return records;

        // Formatting expenses paid as the front end expect.
        const newRecords = records.map((record) => {
          if (record.expensesPaid.length < 1) return record.toJSON();

          const expensesPaid = record.expensesPaid.map((expense) => {
            const { _id, shortName, amount, fullDate, formattedTime } = expense;
            return { _id, shortName, amount, fullDate, formattedTime };
          });
          return { ...record.toJSON(), expensesPaid };
        });
        return newRecords;
      }

      if (records.length === 0) {
        // returning a message because this service is used when an account is deleted. If no records are found and an exception is throwed,
        // it would break the service to delete an account with no records.
        const message = !isIncome ? EXPENSE_NOT_FOUND : INCOME_NOT_FOUND;
        return message;
      }

      return records;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createMultipleRecords(
    data: CreateExpenseDto[] | CreateIncomeDto[],
    isIncome = false,
  ) {
    try {
      const newModels = !isIncome
        ? data.map((account) => {
            return new this.expenseModel(account);
          })
        : data.map((account) => {
            return new this.incomeModel(account);
          });
      const savedModels = await Promise.all(
        newModels.map((account) => account.save()),
      );
      return savedModels;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRecord(
    changes: UpdateIncomeDto | UpdateExpenseDto,
    isIncome = false,
  ) {
    try {
      const { recordId } = changes;
      const updatedRecord = !isIncome
        ? await this.expenseModel
            .findByIdAndUpdate(recordId, { $set: changes }, { new: true })
            .exec()
        : await this.incomeModel
            .findByIdAndUpdate(recordId, { $set: changes }, { new: true })
            .exec();

      if (!updatedRecord) throw new BadRequestException('Record not found');
      return updatedRecord;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateMultipleRecords(
    changes: UpdateIncomeDto[] | UpdateExpenseDto[],
    isIncome = false,
  ) {
    try {
      const updatedRecords = await Promise.all(
        changes.map((change) =>
          !isIncome
            ? this.expenseModel.findByIdAndUpdate(
                change.recordId,
                { $set: change },
                { new: true },
              )
            : this.incomeModel.findByIdAndUpdate(
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

  async removeRecord(payload: DeleteRecordDto, isIncome = false) {
    try {
      const { recordId } = payload;
      const recordDeleted = !isIncome
        ? await this.expenseModel.findByIdAndDelete(recordId)
        : await this.incomeModel.findByIdAndDelete(recordId);
      if (!recordDeleted) throw new BadRequestException('Record not found');
      return recordDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMultipleRecords(records: DeleteRecordDto[], isIncome = false) {
    try {
      const recordsIds = records.map((record) => record.recordId);
      const deletedRecords = !isIncome
        ? await Promise.all(
            recordsIds.map((id) => this.expenseModel.findByIdAndDelete(id)),
          )
        : await Promise.all(
            recordsIds.map((id) => this.incomeModel.findByIdAndDelete(id)),
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
