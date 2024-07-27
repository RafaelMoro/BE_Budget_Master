import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { ACCOUNT_NOT_FOUND } from '../constants';
import { AccountModel } from '../accounts.interface';
import { Account as AccountEntity } from '../entities/accounts.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountDto,
} from '../dtos/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(AccountEntity.name) private accountModel: Model<AccountEntity>,
  ) {}

  async validateAccountBelongsUser({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }) {
    try {
      const account = await this.findById(accountId);
      if (!account) throw new BadRequestException(ACCOUNT_NOT_FOUND);

      if (String(account.sub) !== userId) {
        throw new UnauthorizedException('Account does not belong to the user');
      }
    } catch (error) {
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async createOneAccount(data: CreateAccountDto, userId: string) {
    try {
      const completeData = { ...data, sub: userId };
      const newModel = new this.accountModel(completeData);
      const model: AccountModel = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByUser(sub: string) {
    try {
      const accounts: AccountModel[] = await this.accountModel
        .find({ sub: sub })
        .exec();
      return accounts;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findById(accountId: string) {
    try {
      const account: AccountModel = await this.accountModel.findById(accountId);
      return account;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(changes: UpdateAccountDto) {
    try {
      const { accountId } = changes;
      const updatedAccount: AccountModel = await this.accountModel
        .findByIdAndUpdate(accountId, { $set: changes }, { new: true })
        .exec();
      if (!updatedAccount) throw new BadRequestException('Account not found');

      return updatedAccount;
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
      const accountDeleted: AccountModel =
        await this.accountModel.findByIdAndDelete(accountId);
      if (!accountDeleted) throw new BadRequestException(ACCOUNT_NOT_FOUND);

      return accountDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
