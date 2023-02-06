import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Account } from '../entities/accounts.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountDto,
} from '../dtos/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  async createOne(data: CreateAccountDto) {
    try {
      const newModel = new this.accountModel(data);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createMultipleAccounts(data: CreateAccountDto[]) {
    try {
      const newModels = data.map((account) => {
        return new this.accountModel(account);
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
      const { accountId } = payload;
      const accountDeleted = await this.accountModel.findByIdAndDelete(
        accountId,
      );
      if (!accountDeleted) throw new BadRequestException('Account not found');
      return accountDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
