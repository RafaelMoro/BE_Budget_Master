import { Module } from '@nestjs/common';
import { AccountsController } from './controllers/accounts.controller';
import { AccountsService } from './services/accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService]
})
export class AccountsModule {}
