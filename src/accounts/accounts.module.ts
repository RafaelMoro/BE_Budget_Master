import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RecordsModule } from '../records/records.module';
import { AccountsController } from './controllers/accounts.controller';
import { Account, AccountsSchema } from './entities/accounts.entity';
import { AccountsService } from './services/accounts.service';
import { IncomesModule } from 'src/incomes/incomes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Account.name,
        schema: AccountsSchema,
      },
    ]),
    RecordsModule,
    IncomesModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
