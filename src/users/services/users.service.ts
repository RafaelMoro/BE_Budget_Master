import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

import {
  CreateUserDto,
  UpdateUserDto,
  ForgotPasswordUserDto,
} from '../dtos/users.dto';
import { User } from '../entities/users.entity';
import { PayloadToken } from '../../auth/interfaces';
import { MailService } from '../../mail/mail.service';
import { MailForgotPasswordDto } from '../../mail/dtos/mail.dtos';

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

  // crear un metodo de update para cambiar firstname middlename o secondname
  async update(changes: UpdateUserDto) {
    const { email, password } = changes;
    console.log(email, password);
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

  async forgotPassword(payload: ForgotPasswordUserDto) {
    const { email, hostname } = payload;
    const user = await this.findByEmail(email);
    if (!user) return null;

    const { firstName, lastName } = user;
    const payloadToken: PayloadToken = { sub: user.id };
    const oneTimeToken = this.jwtService.sign(payloadToken);
    await this.userModel.updateOne(
      { _id: user.id },
      { oneTimeToken },
      { multi: true },
    );

    const emailPayload: MailForgotPasswordDto = {
      email,
      hostname,
      firstName,
      lastName,
      oneTimeToken,
    };
    await this.mailService.sendUserForgotPasswordEmail(emailPayload);
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      if (error?.message === 'jwt expired') {
        throw new BadRequestException('JWT Expired');
      }
      if (error?.message === 'jwt malformed') {
        throw new BadRequestException('Invalid JWT');
      }
    }
  }

  async resetPassword(oneTimeToken: string, password: string) {
    const tokenVerified = this.verifyToken(oneTimeToken);
    if (!tokenVerified) throw new BadRequestException('Invalid JWT');

    const userId = tokenVerified.sub;
    const user = await this.userModel.findOne({ _id: userId }).exec();
    const { email } = user;

    const userOneTimeToken = user.oneTimeToken;
    if (oneTimeToken !== userOneTimeToken)
      throw new BadRequestException('Wrong JWT');

    await this.update({ email, password });
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
