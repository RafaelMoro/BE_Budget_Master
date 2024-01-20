import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_NOT_FOUND,
  ACCOUNT_UPDATED_MESSAGE,
} from '../constants';
import { VERSION_RESPONSE } from '../../constants';
import { EXPENSE_NOT_FOUND, INCOME_NOT_FOUND } from '../../records/constants';
import {
  AccountResponse,
  DeleteAccountResponse,
  GeneralAccountResponse,
  GetAccountResponse,
} from '../accounts.interface';
import { Account } from '../entities/accounts.entity';
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

  async createOneAccount(data: CreateAccountDto, userId: string) {
    try {
      const completeData = { ...data, sub: userId };
      const newModel = new this.accountModel(completeData);
      const model: AccountResponse = await newModel.save();
      const response: GeneralAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_CREATED_MESSAGE,
        data: {
          account: model,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByUser(sub: string) {
    try {
      const accounts: AccountResponse[] = await this.accountModel
        .find({ sub: sub })
        .exec();

      const response: GetAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          accounts,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(changes: UpdateAccountDto) {
    try {
      const { accountId } = changes;
      const updatedAccount: AccountResponse = await this.accountModel
        .findByIdAndUpdate(accountId, { $set: changes }, { new: true })
        .exec();
      if (!updatedAccount) throw new BadRequestException('Account not found');
      const response: GeneralAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_UPDATED_MESSAGE,
        data: {
          account: updatedAccount,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(payload: DeleteAccountDto, userId: string) {
    try {
      let expenseRecords = null;
      let incomesRecords = null;
      const { accountId } = payload;

      // Check if the account has records.
      const expensesRelatedToAccount =
        await this.recordsService.findRecordsByAccount({
          accountId,
          userId,
        });
      const incomesRelatedToAccount =
        await this.recordsService.findRecordsByAccount({
          accountId,
          isIncome: true,
          userId,
        });

      // If the account has expenses, then delete expenses.
      if (
        expensesRelatedToAccount.message !== EXPENSE_NOT_FOUND &&
        expensesRelatedToAccount.message !== INCOME_NOT_FOUND
      ) {
        // Return each record id as object as expected to the service delete multiple records.
        const expensesIds = expensesRelatedToAccount.data.map((record) => {
          return { recordId: record._id };
        });
        const { data } = await this.recordsService.deleteMultipleRecords(
          expensesIds,
        );
        expenseRecords = data;
      }

      // If the account has incomes, then delete incomes.
      if (
        incomesRelatedToAccount.message !== EXPENSE_NOT_FOUND &&
        incomesRelatedToAccount.message !== INCOME_NOT_FOUND
      ) {
        // Return records id as object each as expected to the service delete multiple records.
        const incomesIds = incomesRelatedToAccount.data.map((record) => {
          return { recordId: record._id };
        });
        const { data } = await this.recordsService.deleteMultipleRecords(
          incomesIds,
          true,
        );
        incomesRecords = data;
      }

      // After deleting records related to this account if found, delete the account.
      const accountDeleted: AccountResponse =
        await this.accountModel.findByIdAndDelete(accountId);
      if (!accountDeleted) throw new BadRequestException(ACCOUNT_NOT_FOUND);

      const response: DeleteAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_DELETED_MESSAGE,
        data: {
          accountDeleted,
          numberExpensesDeleted: expenseRecords?.length ?? 0,
          numberIncomesDeleted: incomesRecords?.length ?? 0,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
