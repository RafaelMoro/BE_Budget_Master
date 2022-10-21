import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class MailForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly hostname: string;

  @IsString()
  @IsNotEmpty()
  readonly oneTimeToken: string;

  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;
}
