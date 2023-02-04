import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateAccountDto, GetAccountsByUserDto } from '../dtos/accounts.dto';
import { AccountsService } from '../services/accounts.service';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  findByUser(@Body() payload: GetAccountsByUserDto) {
    const { sub } = payload;
    return this.accountsService.findByUser(sub);
  }

  @Post()
  create(@Body() payload: CreateAccountDto) {
    return this.accountsService.create(payload);
  }
}
