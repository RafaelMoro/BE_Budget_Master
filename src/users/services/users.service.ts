import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordUserDto,
} from '../dtos/users.dto';
import { User } from '../entities/users.entity';
import { PayloadToken } from '../../auth/interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

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
    const user = await this.findByEmail(email);
    const userId = user?._id.toString();

    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { password: passwordHashed } },
        { new: true },
      )
      .exec();
  }

  async resetPassword(payload: ResetPasswordUserDto) {
    const { email } = payload;
    const user = await this.findByEmail(email);
    if (!user) return null;

    const payloadToken: PayloadToken = { sub: user.id };
    return {
      oneTimeToken: this.jwtService.sign(payloadToken),
      user,
    };
    // Save the token into the user
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
