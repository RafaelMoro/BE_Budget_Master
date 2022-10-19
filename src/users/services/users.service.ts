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

  async update(changes: UpdateUserDto) {
    const { email, password } = changes;
    const passwordHashed = await bcrypt.hash(password, 10);
    console.log('password hashed', passwordHashed);
    const newChanges = { email, passwordHashed };
    const user = await this.findByEmail(email);
    console.log('user', user);
    const userId = user?._id.toString();
    console.log(userId);
    const doc = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { $set: { password: passwordHashed } },
        { new: true },
      )
      .exec();
    console.log(doc);
    return doc;
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
