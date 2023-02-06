import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateAccountDto,
  GetAccountsByUserDto,
  UpdateAccountDto,
  DeleteAccountDto,
} from '../dtos/accounts.dto';
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
    return this.accountsService.createOne(payload);
  }

  @Post('/multiple')
  createMultiple(@Body() payload: CreateAccountDto[]) {
    return this.accountsService.createMultipleAccounts(payload);
  }

  @Put()
  update(@Body() payload: UpdateAccountDto) {
    return this.accountsService.update(payload);
  }

  @Delete()
  remove(@Body() payload: DeleteAccountDto) {
    return this.accountsService.remove(payload);
  }
}
