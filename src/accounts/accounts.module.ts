import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Account as AccountEntity,
  AccountsSchema,
} from './entities/accounts.entity';
import { AccountsService } from './services/accounts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccountEntity.name,
        schema: AccountsSchema,
      },
    ]),
  ],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
