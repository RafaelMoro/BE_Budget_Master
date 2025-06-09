import { Resend } from 'resend';
import { ConfigType } from '@nestjs/config';
import config from '@/config';
import { BadRequestException, Injectable, Inject } from '@nestjs/common';

import { MailForgotPasswordDto } from './dtos/mail.dtos';
import ResetPassword from '../../emails/ResetPassword';
import { PROD_URI } from '@/constants';
import React from 'react';

@Injectable()
export class MailService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async sendUserForgotPasswordEmail(payload: MailForgotPasswordDto) {
    try {
      const resend = new Resend(this.configService.mailer.resendApiKey);
      const { oneTimeToken, email, firstName, lastName } = payload;
      const url = `${PROD_URI}/reset-password/${oneTimeToken}`;

      resend.emails.send({
        from: 'no-reply@updates.budget-master.space',
        to: email,
        subject: 'Recupera tu contraseña en Budget Master',
        react: React.createElement(ResetPassword, { url, firstName, lastName }),
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
