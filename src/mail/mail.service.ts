import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

import { ForgotPasswordPayload } from 'src/users/entities/users.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotPasswordEmail(email: string) {
    // const {
    //   oneTimeToken,
    //   hostname,
    //   user: { email },
    // } = payload;
    // console.log(email, hostname, oneTimeToken);
    // definir url
    // const url = `${hostname}/users/reset-password/:${oneTimeToken}`;

    // Change email for name of the user.
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Password Request',
      template: './reset-password',
    });
  }
}
