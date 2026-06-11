import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Pragmatische Obergrenzen verhindern unbounded Payloads und schuetzen
// vor DoS via argon2/JWT-Decode auf riesigen Strings.
const PASSWORD_MAX = 200;
const EMAIL_MAX = 320; // RFC 5321
const REFRESH_TOKEN_MAX = 256;
const VERIFY_TOKEN_MAX = 256;
const OAUTH_TOKEN_MAX = 8192; // Apple/Google JWTs sind ~1-3 KB, mit Spielraum

export class RegisterDto {
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(PASSWORD_MAX)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email!: string;

  @IsString()
  @MaxLength(PASSWORD_MAX)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MaxLength(REFRESH_TOKEN_MAX)
  refreshToken!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(REFRESH_TOKEN_MAX)
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MaxLength(VERIFY_TOKEN_MAX)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(PASSWORD_MAX)
  newPassword!: string;
}

export class AppleLoginDto {
  @IsString()
  @MaxLength(OAUTH_TOKEN_MAX)
  identityToken!: string;
}

export class GoogleLoginDto {
  @IsString()
  @MaxLength(OAUTH_TOKEN_MAX)
  idToken!: string;
}
