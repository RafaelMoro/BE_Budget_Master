import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Account } from '../entities/accounts.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dtos/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  create(data: CreateAccountDto) {
    const newModel = new this.accountModel(data);
    return newModel.save();
  }

  findByUser(sub: string) {
    return this.accountModel.find({ sub: sub }).exec();
  }

  update(id: string, changes: UpdateAccountDto) {
    return this.accountModel
      .findByIdAndUpdate(id, { $set: changes }, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.accountModel.findByIdAndDelete(id);
  }
}
