import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Account } from '../entities/accounts.entity';
import { EXPENSE_NOT_FOUND, INCOME_NOT_FOUND } from '../../records/constants';
import { RecordsService } from '../../records/services/records.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountDto,
} from '../dtos/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private recordsService: RecordsService,
  ) {}

  async createOne(data: CreateAccountDto, userId: string) {
    try {
      const completeData = { ...data, sub: userId };
      const newModel = new this.accountModel(completeData);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createMultipleAccounts(data: CreateAccountDto[], userId: string) {
    try {
      const newModels = data.map((account) => {
        const completeData = { ...account, sub: userId };
        return new this.accountModel(completeData);
      });
      const savedModels = await Promise.all(
        newModels.map((account) => account.save()),
      );
      return savedModels;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByUser(sub: string) {
    try {
      const accounts = await this.accountModel.find({ sub: sub }).exec();
      return accounts;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(changes: UpdateAccountDto) {
    try {
      const { accountId } = changes;
      const updatedAccount = await this.accountModel
        .findByIdAndUpdate(accountId, { $set: changes }, { new: true })
        .exec();
      if (!updatedAccount) throw new BadRequestException('Account not found');
      return updatedAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(payload: DeleteAccountDto) {
    try {
      const deletedRecords = null;
      const { accountId } = payload;

      // Check if the account has records.
      const expensesRelatedToAccount =
        await this.recordsService.findRecordsByAccount(accountId);
      const incomesRelatedToAccount =
        await this.recordsService.findRecordsByAccount(accountId, true);

      // If the account has records, then execute this code.
      // if (
      //   expensesRelatedToAccount !== EXPENSE_NOT_FOUND ||
      //   incomesRelatedToAccount !== INCOME_NOT_FOUND
      // ) {
      //   // Return records id as object each as expected to the service delete multiple records.
      //   const expensesIds = expensesRelatedToAccount.map((record) => {
      //     return { recordId: record._id };
      //   });
      //   deletedRecords = await this.recordsService.deleteMultipleRecords(
      //     recordsIds,
      //   );
      // }

      // After deleting records related to this account if found, delete the account.
      const accountDeleted = await this.accountModel.findByIdAndDelete(
        accountId,
      );
      if (!accountDeleted) throw new BadRequestException('Account not found');
      return {
        ...accountDeleted.toJSON(),
        deletedRecords: deletedRecords,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
