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
import { MailService } from '../../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailService: MailService,
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
    const { email, hostname } = payload;
    const user = await this.findByEmail(email);
    console.log(email, hostname);
    console.log(user);
    if (!user) return null;

    const payloadToken: PayloadToken = { sub: user.id };
    const oneTimeToken = this.jwtService.sign(payloadToken);

    // arreglar que user tambien pasa el password hasheado
    console.log(user, hostname, oneTimeToken);
    await this.mailService.sendUserForgotPasswordEmail(email);
    // Save the token into the user
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
