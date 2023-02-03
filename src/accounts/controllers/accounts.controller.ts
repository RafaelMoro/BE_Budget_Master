import { Body, Controller, Post } from '@nestjs/common';
import { CreateAccountDto } from '../dtos/accounts.dto';
import { AccountsService } from '../services/accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  create(@Body() payload: CreateAccountDto) {
    return this.accountsService.create(payload);
  }
}
