import { Body, Controller, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeleteAccountDto } from '../../accounts/dtos/accounts.dto';
import { AccountsActionsService } from '../services/Accounts/accounts.-actions.service';

@UseGuards(JwtAuthGuard)
@Controller('user-accounts-actions')
export class UserAccountsActionsController {
  constructor(private userAccountActionsService: AccountsActionsService) {}

  @Delete('delete-account')
  remove(@Body() payload: DeleteAccountDto, @Request() req) {
    const userId = req.user.sub;
    return this.userAccountActionsService.deleteAccount({ payload, userId });
  }
}
