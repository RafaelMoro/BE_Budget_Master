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
  ResetPasswordUserDto,
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
  @Post('/reset-password')
  resetPassword(@Req() request: Request) {
    const {
      body: { email },
      hostname,
    } = request;
    const payload: ResetPasswordUserDto = { email, hostname };
    // falta cambiar el servicio de reset Password del payload
    return this.usersService.resetPassword(payload);
  }
}
