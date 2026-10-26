import { IsNotEmpty, IsString, Length, Matches, IsEmail } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?:\+?880|880|0)?(1[3-9]\d{8})$/, {
    message: 'Must be a valid Bangladeshi phone number (+8801XXXXXXXXX or 01XXXXXXXXX)',
  })
  phone!: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?:\+?880|880|0)?(1[3-9]\d{8})$/, {
    message: 'Must be a valid Bangladeshi phone number',
  })
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code!: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?:\+?880|880|0)?(1[3-9]\d{8})$/, {
    message: 'Must be a valid Bangladeshi phone number',
  })
  phone!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 50, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier!: string; // phone or email

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid Gmail or email address' })
  email!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid Gmail or email address' })
  email!: string;

  @IsNotEmpty({ message: 'Verification code is required' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code!: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @Length(6, 50, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}
