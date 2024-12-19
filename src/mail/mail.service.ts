import { MailerService } from '@nestjs-modules/mailer';
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
      const { oneTimeToken, hostname, email, firstName, lastName } = payload;
      const newHostname =
        this.configService.environment !== 'development' ? PROD_URI : hostname;
      const url = `${newHostname}/reset-password/${oneTimeToken}`;

      // Change email for name of the user.
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Password Request',
        template: './reset-password',
        context: {
          firstName,
          lastName,
          url,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
