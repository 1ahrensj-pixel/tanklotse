import { Body, Controller, Get, Headers, HttpCode, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

class AppleVerifyDto {
  @IsString() receiptData!: string;
}

class GoogleVerifyDto {
  @IsString() productId!: string;
  @IsString() purchaseToken!: string;
}

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  status(@CurrentUser() user: JwtUser) {
    return this.service.status(user.sub);
  }

  @Post('apple/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  apple(@CurrentUser() user: JwtUser, @Body() body: AppleVerifyDto) {
    return this.service.verifyApple(user.sub, body.receiptData);
  }

  @Post('google/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  google(@CurrentUser() user: JwtUser, @Body() body: GoogleVerifyDto) {
    return this.service.verifyGoogle(user.sub, body.productId, body.purchaseToken);
  }

  @Post('stripe/webhook')
  @HttpCode(200)
  stripe(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return this.service.stripeWebhook(req.rawBody as Buffer, signature);
  }
}
