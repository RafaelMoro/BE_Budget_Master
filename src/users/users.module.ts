import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import config from '../config';
import { JWT_ONE_TIME_EXPIRE_TIME } from '../auth/constants';
import { UsersController } from './controllers/users.controller';
import { User, UsersSchema } from './entities/users.entity';
import { UsersService } from './services/users.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UsersSchema,
      },
    ]),
    JwtModule.registerAsync({
      useFactory: (configServices: ConfigType<typeof config>) => {
        return {
          secret: configServices.jwtOneTimeKey,
          signOptions: {
            expiresIn: JWT_ONE_TIME_EXPIRE_TIME,
          },
        };
      },
      inject: [config.KEY],
    }),
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
