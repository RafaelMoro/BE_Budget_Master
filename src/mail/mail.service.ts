import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

import { MailForgotPasswordDto } from './dtos/mail.dtos';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotPasswordEmail(payload: MailForgotPasswordDto) {
    const { oneTimeToken, hostname, email, firstName, lastName } = payload;
    const url = `${hostname}/reset-password/${oneTimeToken}`;

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
  }
}
