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
            host: configServices.mailer.smtpHost,
            secure: true,
            ignoreTLS: true,
            port: Number(configServices.mailer.smtpPort),
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
