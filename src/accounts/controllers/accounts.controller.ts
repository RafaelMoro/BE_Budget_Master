import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateAccountDto, UpdateAccountDto } from '../dtos/accounts.dto';
import { AccountsService } from '../services/accounts.service';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  findByUser(@Request() req) {
    const userId = req.user.sub;
    return this.accountsService.findByUser(userId);
  }

  @Post()
  create(@Body() payload: CreateAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.accountsService.createOneAccount(payload, userId);
  }

  @Put()
  update(@Body() payload: UpdateAccountDto) {
    return this.accountsService.update(payload);
  }
}
