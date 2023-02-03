import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from '../entities/accounts.entity';
import { CreateAccountDto } from '../dtos/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  create(data: CreateAccountDto) {
    const newModel = new this.accountModel(data);
    return newModel.save();
  }
}
