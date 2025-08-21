import { Injectable } from "@nestjs/common";
import { SmsController } from './sms.controller';
import axios from "axios";

@Injectable()
export class SmsService {
  private readonly DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;
  private readonly API_KEY = process.env.TEXTBEE_API_KEY;

  async sendSms(recipients: string[], message: string) {
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${this.DEVICE_ID}/send-sms`;

    await axios.post(
      url,
      { recipients, message },
      { headers: { "x-api-key": this.API_KEY } }
    );

    return { success: true, message: "SMS sent" };
  }

  async getReceivedSms() {
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${this.DEVICE_ID}/get-received-sms`;

    const response = await axios.get(url, {
      headers: { "x-api-key": this.API_KEY },
    });

    return response.data;
  }
}

