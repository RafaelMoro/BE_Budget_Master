import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { AccountsModule } from './repositories/accounts/accounts.module';
import { RecordsModule } from './domain/records/records.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './repositories/expenses/expenses.module';
import { IncomesModule } from './repositories/incomes/incomes.module';
import { BudgetsModule } from './budgets/budgets.module';
import { BudgetHistoryModule } from './budget-history/budget-history.module';
import { UserActionsModule } from './domain/user-accounts-actions/user-actions.module';
import { ExpensesActionsModule } from './domain/expenses-actions/expenses-actions.module';
import { IncomesActionsModule } from './domain/incomes-actions/incomes-actions.module';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        CLUSTER: Joi.string().required(),
        MONGO_USER: Joi.string().required(),
        MONGO_PWD: Joi.string().required(),
        MONGO_DB_NAME: Joi.string().required(),
        MONGO_CONNECTION: Joi.string().required(),
        JWT_KEY: Joi.string().required(),
        ONE_TIME_JWT_KEY: Joi.string().required(),
        PUBLIC_KEY: Joi.string().required(),
        FRONTEND_URI: Joi.string().required(),
        TEST_FRONTEND_URI: Joi.string().required(),
        MAILER_MAIL: Joi.string().required(),
        MAILER_PWD: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.string().required(),
        FRONTEND_PORT: Joi.string().required(),
        ENVIRONMENT: Joi.string().required(),
        DOMAIN_URI: Joi.string().required(),
      }),
    }),
    AuthModule,
    UsersModule,
    DatabaseModule,
    MailModule,
    AccountsModule,
    RecordsModule,
    CategoriesModule,
    ExpensesModule,
    IncomesModule,
    BudgetsModule,
    BudgetHistoryModule,
    UserActionsModule,
    ExpensesActionsModule,
    IncomesActionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
