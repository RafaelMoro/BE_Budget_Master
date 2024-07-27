import {
  Body,
  Controller,
  Delete,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateAccountDto,
  DeleteAccountDto,
} from '../../accounts/dtos/accounts.dto';
import { AccountsActionsService } from '../services/Accounts/accounts.-actions.service';

@UseGuards(JwtAuthGuard)
@Controller('accounts-actions')
export class UserAccountsActionsController {
  constructor(private userAccountActionsService: AccountsActionsService) {}

  @Post('create-account')
  createAccount(@Body() payload: CreateAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.createAccount({
      data: payload,
      userId,
    });
  }

  @Delete('delete-account')
  remove(@Body() payload: DeleteAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.deleteAccount({ payload, userId });
  }
}
