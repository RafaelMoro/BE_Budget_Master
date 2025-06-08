import { MailerService } from '@nestjs-modules/mailer';
import { Resend } from 'resend';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { BadRequestException, Injectable, Inject } from '@nestjs/common';

import { MailForgotPasswordDto } from './dtos/mail.dtos';
import { PROD_URI } from '@/constants';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async sendUserForgotPasswordEmail(payload: MailForgotPasswordDto) {
    try {
      const resend = new Resend(this.configService.mailer.resendApiKey);
      // const { oneTimeToken, email, firstName, lastName } = payload;
      // const url = `${PROD_URI}/reset-password/${oneTimeToken}`;

      // Change email for name of the user.
      // await this.mailerService.sendMail({
      //   to: email,
      //   subject: 'Reset Password Request',
      //   template: './reset-password',
      //   context: {
      //     firstName,
      //     lastName,
      //     url,
      //   },
      // });
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'count.on.me.app.personal.finances@gmail.com',
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
