import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import {
  resetErrorPage,
  resetFormPage,
  verifyErrorPage,
  verifySuccessPage,
} from './auth-pages';
import {
  AppleLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

// Brute-Force-Schutz (Defense-in-Depth zum Account-Lockout):
// Sensible Auth-Endpunkte bekommen ein eigenes, strengeres IP-Rate-Limit als
// das globale RATE_LIMIT_MAX. Werte sind env-konfigurierbar, damit lokale
// E2E-Suiten (viele Logins pro Minute) nicht ausgesperrt werden —
// Production-Werte stehen in .env.production.example.
const authThrottle = (envKey: string, fallback: number) => ({
  default: {
    limit: Number(process.env[envKey] ?? fallback),
    ttl: 60_000,
  },
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // Audit-Auftrag §4.1: PrismaService raus aus dem Controller — alle
  // Datenbank-Zugriffe gehen ueber AuthService.
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle(authThrottle('AUTH_RATE_LIMIT_REGISTER', 10))
  @ApiOperation({ summary: 'Registrierung mit E-Mail + Passwort.' })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(authThrottle('AUTH_RATE_LIMIT_LOGIN', 10))
  @ApiOperation({ summary: 'Login mit E-Mail + Passwort.' })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post('login/apple')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login via Apple Sign-In (identityToken).' })
  loginApple(@Body() body: AppleLoginDto) {
    return this.auth.loginWithApple(body.identityToken);
  }

  @Post('login/google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login via Google Sign-In (idToken).' })
  loginGoogle(@Body() body: GoogleLoginDto) {
    return this.auth.loginWithGoogle(body.idToken);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Neuer accessToken via gueltigem refreshToken.' })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoked optionalen refreshToken.' })
  async logout(@CurrentUser() user: JwtUser, @Body() body: LogoutDto) {
    await this.auth.logout(user.sub, body.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @Throttle(authThrottle('AUTH_RATE_LIMIT_FORGOT', 5))
  @ApiOperation({ summary: 'Passwort-Reset-Mail anfordern (anti-enumerative: immer 204).' })
  async forgot(@Body() body: ForgotPasswordDto) {
    await this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @Throttle(authThrottle('AUTH_RATE_LIMIT_RESET', 10))
  @ApiOperation({ summary: 'Neues Passwort setzen mit Reset-Token.' })
  async reset(@Body() body: ResetPasswordDto) {
    await this.auth.resetPassword(body.token, body.newPassword);
  }

  // Wird direkt aus der Mail im Browser geoeffnet → Browser (Accept: text/html)
  // bekommen eine freundliche HTML-Seite, API-Clients weiterhin JSON.
  @Get('verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'E-Mail-Adresse mit Verify-Token bestaetigen.' })
  async verify(
    @Res() res: Response,
    @Headers('accept') accept?: string,
    @Query('token') token?: string,
  ) {
    const wantsHtml = (accept ?? '').includes('text/html');
    const tokenValid = !!token && typeof token === 'string' && token.length >= 8;

    if (!tokenValid) {
      if (wantsHtml) {
        res.status(400).type('html').send(verifyErrorPage());
        return;
      }
      throw new BadRequestException('Token fehlt oder ist ungueltig.');
    }

    try {
      await this.auth.verifyEmail(token);
    } catch (e) {
      if (wantsHtml) {
        res.status(400).type('html').send(verifyErrorPage());
        return;
      }
      throw e;
    }

    if (wantsHtml) {
      res.status(200).type('html').send(verifySuccessPage());
      return;
    }
    res.status(200).json({ ok: true });
  }

  // Ziel des Links aus der Passwort-Reset-Mail (mailer.service.ts). Rendert
  // ein minimales Formular, das per fetch() POST /auth/reset-password aufruft.
  @Get('reset')
  @ApiOperation({ summary: 'Passwort-Reset-Formular (Linkziel aus der Mail).' })
  resetForm(@Res() res: Response, @Query('token') token?: string) {
    if (!token || typeof token !== 'string' || token.length < 8) {
      res.status(400).type('html').send(resetErrorPage());
      return;
    }
    res.status(200).type('html').send(resetFormPage(token));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktueller Nutzer + Profil.' })
  async me(@CurrentUser() user: JwtUser) {
    return this.auth.getCurrentUser(user.sub);
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Account vollstaendig loeschen (DSGVO, kaskadiert).' })
  async deleteMe(@CurrentUser() user: JwtUser) {
    await this.auth.deleteAccount(user.sub);
  }

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'DSGVO-Datenexport (ohne Geheimnisse).' })
  async exportMe(@CurrentUser() user: JwtUser) {
    return this.auth.exportData(user.sub);
  }
}
