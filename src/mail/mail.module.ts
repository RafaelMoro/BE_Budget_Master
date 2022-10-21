import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigType } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import config from '../config';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configServices: ConfigType<typeof config>) => {
        return {
          transport: {
            host: 'smtp.gmail.com',
            secure: true,
            ignoreTLS: true,
            port: 465,
            auth: {
              user: configServices.mailer.email,
              pass: configServices.mailer.pwd,
            },
          },
          defaults: {
            from: configServices.mailer.email,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [config.KEY],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
