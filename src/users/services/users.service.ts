import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { USER_EXISTS_ERROR, VERSION_RESPONSE } from '../../constants';
import {
  DELETE_USER_ERROR,
  DELETE_USER_MESSAGE,
  EMAIL_CHANGE_ERROR,
  FORGOT_PASSWORD_MESSAGE,
  PASSWORD_DIRECT_CHANGE_ERROR,
  PROFILE_UPDATE,
  RESET_PASSWORD_MESSAGE,
  USER_CREATED_MESSAGE,
} from '../constants';
import {
  CreateUserDto,
  UpdateUserPasswordDto,
  ForgotPasswordDto,
  UpdateProfilerDto,
} from '../dtos/users.dto';
import { User } from '../entities/users.entity';
import { MailService } from '../../mail/mail.service';
import { MailForgotPasswordDto } from '../../mail/dtos/mail.dtos';
import { generateJWT } from '../../utils';
import config from '../../config';
import {
  CreateUserResponse,
  UserActionsResponse,
  GeneralUserResponse,
  UserResponse,
} from '../users.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async findByEmail(email: string) {
    try {
      return this.userModel.findOne({ email }).exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByUserId(userId: string) {
    try {
      return this.userModel.findOne({ uid: userId }).exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createUser(data: CreateUserDto) {
    try {
      //Verify if the user exists with the same email.
      const { email: emailData } = data;
      const user: UserResponse = await this.findByEmail(emailData);
      if (user) throw new BadRequestException(USER_EXISTS_ERROR);

      const userModel: UserResponse = new this.userModel(data);
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

  async updatePassword(changes: UpdateUserPasswordDto) {
    try {
      const { uid, password } = changes;
      const passwordHashed = await bcrypt.hash(password, 10);

      const model: UserResponse = await this.userModel
        .findByIdAndUpdate(
          uid,
          { $set: { password: passwordHashed } },
          { new: true },
        )
        .exec();
      const response: GeneralUserResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: PROFILE_UPDATE,
        data: model,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUser(changes: UpdateProfilerDto, userId: string) {
    try {
      const user = await this.findByUserId(userId);
      if (!user) throw new BadRequestException('User not found');

      const {
        email: emailFromChanges,
        password: passwordFromChanges,
        ...restProps
      } = changes;
      if (emailFromChanges) throw new BadRequestException(EMAIL_CHANGE_ERROR);
      if (passwordFromChanges)
        throw new BadRequestException(PASSWORD_DIRECT_CHANGE_ERROR);

      const model: UserResponse = await this.userModel
        .findByIdAndUpdate(userId, { $set: restProps }, { new: true })
        .exec();
      const response: GeneralUserResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: PROFILE_UPDATE,
        data: model,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    try {
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

      const response: UserActionsResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: FORGOT_PASSWORD_MESSAGE,
        data: null,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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

      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(oneTimeToken: string, password: string) {
    try {
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
      const response: UserActionsResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: RESET_PASSWORD_MESSAGE,
        data: null,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteUser(email: string, userId: string) {
    try {
      const user = await this.findByUserId(userId);
      const { email: emailModel } = user;
      console.log('user', user);
      console.log('email', email);
      console.log('email model', emailModel);
      console.log('condition', email !== emailModel);
      if (email !== emailModel)
        throw new UnauthorizedException(DELETE_USER_ERROR);

      await this.userModel.findByIdAndDelete(userId);
      const response: UserActionsResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: DELETE_USER_MESSAGE,
        data: null,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
