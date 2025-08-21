// src/sms/sms.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.module';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendSms(@Body('phone') phone: string, @Body('message') message: string) {
    // TextBee expects recipients as an array
    return this.smsService.sendSms([phone], message);
  }
}

