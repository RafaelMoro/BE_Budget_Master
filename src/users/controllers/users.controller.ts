import {
  Body,
  Req,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  CreateUserDto,
  UpdateUserDto,
  ForgotPasswordUserDto,
  ResetPasswordDto,
} from '../dtos/users.dto';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { User } from '../entities/users.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  createUser(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }

  @Put()
  updateUser(@Body() payload: UpdateUserDto) {
    return this.usersService.update(payload);
  }

  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
  }

  @Public()
  @Post('/forgot-password')
  forgotPassword(@Req() request: Request) {
    const {
      body: { email },
      hostname,
    } = request;
    const payload: ForgotPasswordUserDto = { email, hostname };
    return this.usersService.forgotPassword(payload);
  }

  @Public()
  @Post('/reset-password/:oneTimeToken')
  resetPassword(
    @Param('oneTimeToken') oneTimeToken: string,
    @Body() changes: ResetPasswordDto,
  ) {
    const { password } = changes;
    return this.usersService.resetPassword(oneTimeToken, password);
  }
}
