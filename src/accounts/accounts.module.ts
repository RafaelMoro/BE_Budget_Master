import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AccountsController } from './controllers/accounts.controller';
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
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
