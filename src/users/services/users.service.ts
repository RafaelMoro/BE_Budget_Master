import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { User } from '../entities/users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  findAll() {
    return this.userModel.find().exec();
  }

  async create(data: CreateUserDto) {
    const userModel = new this.userModel(data);
    const passwordHashed = await bcrypt.hash(userModel.password, 10);
    userModel.password = passwordHashed;
    const modelSaved = await userModel.save();
    const { password, ...rta } = modelSaved.toJSON();
    return rta;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  update(id: string, changes: UpdateUserDto) {
    return this.userModel
      .findByIdAndUpdate(id, { $set: changes }, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
