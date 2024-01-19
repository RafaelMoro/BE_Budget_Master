import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @IsString()
  readonly middleName: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
export class UpdateProfilerDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  readonly uid: string;
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly hostname: string;
}

export class ForgotPasswordBodyDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
