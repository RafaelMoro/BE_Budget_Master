import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_NOT_FOUND,
  ACCOUNT_UPDATED_MESSAGE,
} from '../constants';
import { VERSION_RESPONSE } from '../../constants';
import {
  AccountResponse,
  GeneralAccountResponse,
  GetAccountResponse,
} from '../accounts.interface';
import { Account } from '../entities/accounts.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountDto,
} from '../dtos/accounts.dto';
import { RecordsService } from 'src/records/services/records.service';

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

  async findById(accountId: string) {
    try {
      const account: AccountResponse = await this.accountModel.findById(
        accountId,
      );
      return account;
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

  async modifyAccountBalanceOnExpense({
    newAmount,
    previousAmount,
    accountId,
  }: {
    newAmount: number;
    previousAmount: number;
    accountId: string;
  }) {
    try {
      const account = await this.findById(accountId);
      if (!account) throw new BadRequestException('Account not found');

      const { amount: currentAmount } = account;
      const amountResultExpense = currentAmount + previousAmount - newAmount;

      const changes: UpdateAccountDto = {
        accountId,
        amount: amountResultExpense,
      };
      const updatedAccount = await this.update(changes);
      return updatedAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async modifyAccountBalanceOnIncome({
    newAmount,
    previousAmount,
    accountId,
  }: {
    newAmount: number;
    previousAmount: number;
    accountId: string;
  }) {
    try {
      const account = await this.findById(accountId);
      if (!account) throw new BadRequestException('Account not found');

      const { amount: currentAmount } = account;
      const amountResultIncome = currentAmount - previousAmount + newAmount;

      const changes: UpdateAccountDto = {
        accountId,
        amount: amountResultIncome,
      };
      const updatedAccount = await this.update(changes);
      return updatedAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(payload: DeleteAccountDto) {
    try {
      const { accountId } = payload;

      // After deleting records related to this account if found, delete the account.
      const accountDeleted: AccountResponse =
        await this.accountModel.findByIdAndDelete(accountId);
      if (!accountDeleted) throw new BadRequestException(ACCOUNT_NOT_FOUND);

      return accountDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
