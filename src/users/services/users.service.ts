import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { USER_EXISTS_ERROR, VERSION_RESPONSE } from '../../constants';
import { USER_CREATED_MESSAGE } from '../constants';
import {
  CreateUserDto,
  UpdateUserPasswordDto,
  ForgotPasswordDto,
} from '../dtos/users.dto';
import { User } from '../entities/users.entity';
import { MailService } from '../../mail/mail.service';
import { MailForgotPasswordDto } from '../../mail/dtos/mail.dtos';
import { IResponse } from '../../interfaces';
import { generateJWT } from '../../utils';
import config from '../../config';
import { CreateUserResponse, UserResponse } from '../users.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(data: CreateUserDto) {
    try {
      //Verify if the user exists with the same email.
      const { email: emailData } = data;
      const user = await this.findByEmail(emailData);
      if (user) throw new BadRequestException(USER_EXISTS_ERROR);

      const userModel = new this.userModel(data);
      const passwordHashed = await bcrypt.hash(userModel.password, 10);
      userModel.password = passwordHashed;
      const modelSaved: UserResponse = await userModel.save();
      const { email } = modelSaved.toJSON();
      // const rta = { emailModel, message: 'User created' };
      const response: CreateUserResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: USER_CREATED_MESSAGE,
        data: { email },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // crear un metodo de update para cambiar firstname middlename o secondname
  async updatePassword(changes: UpdateUserPasswordDto) {
    const { uid, password } = changes;
    const passwordHashed = await bcrypt.hash(password, 10);

    return this.userModel
      .findByIdAndUpdate(
        uid,
        { $set: { password: passwordHashed } },
        { new: true },
      )
      .exec();
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const { email, hostname } = payload;
    const { frontendPort, backendUri } = this.configService;
    const completeHostname =
      hostname === 'localhost'
        ? `http://${hostname}:${frontendPort}`
        : `http://${backendUri}`;

    const user: User = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName } = user;
    const oneTimeToken = generateJWT(user, this.jwtService);
    await this.userModel.updateOne(
      { _id: user.id },
      { oneTimeToken },
      { multi: true },
    );

    const emailPayload: MailForgotPasswordDto = {
      email,
      hostname: completeHostname,
      firstName,
      lastName,
      oneTimeToken,
    };
    await this.mailService.sendUserForgotPasswordEmail(emailPayload);
    const response: IResponse = { response: 'email sent' };
    return response;
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
    if (!user) throw new BadRequestException('The user does not exist');
    const { _id } = user;

    const userOneTimeToken = user.oneTimeToken;
    if (!userOneTimeToken) throw new BadRequestException('JWT not found');

    if (oneTimeToken !== userOneTimeToken)
      throw new BadRequestException('Wrong JWT');

    await this.userModel.updateOne(
      { _id: user.id },
      { $unset: { oneTimeToken: '' } },
    );
    await this.updatePassword({ uid: _id, password });
    const response: IResponse = { response: 'password reset successfully' };
    return response;
  }

  async remove(email: string) {
    try {
      const userId = await this.findByEmail(email);
      const userDeleted = await this.userModel.findByIdAndDelete(userId);
      return userDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
