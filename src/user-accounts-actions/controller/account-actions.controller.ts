import {
  Body,
  Controller,
  Delete,
  UseGuards,
  Request,
  Post,
  Get,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateAccountDto,
  DeleteAccountDto,
  UpdateAccountDto,
} from '../../accounts/dtos/accounts.dto';
import { AccountsActionsService } from '../services/accounts.-actions.service';

@UseGuards(JwtAuthGuard)
@Controller('account-actions')
export class UserAccountsActionsController {
  constructor(private userAccountActionsService: AccountsActionsService) {}

  @Get()
  findByUser(@Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.findByUser({ userId });
  }

  @Post()
  createAccount(@Body() payload: CreateAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.createAccount({
      data: payload,
      userId,
    });
  }

  @Put()
  update(@Body() payload: UpdateAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.updateAccount({
      changes: payload,
      userId,
    });
  }

  @Delete()
  remove(@Body() payload: DeleteAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.deleteAccount({ payload, userId });
  }
}
