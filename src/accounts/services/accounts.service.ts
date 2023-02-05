import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Account } from '../entities/accounts.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dtos/accounts.dto';

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

  findByUser(sub: string) {
    return this.accountModel.find({ sub: sub }).exec();
  }

  async update(id: string, changes: UpdateAccountDto) {
    try {
      const updatedAccount = await this.accountModel
        .findByIdAndUpdate(id, { $set: changes }, { new: true })
        .exec();
      return updatedAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    try {
      const accountDeleted = await this.accountModel.findByIdAndDelete(id);
      return accountDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
