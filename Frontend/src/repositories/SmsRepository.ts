import type { CreateEmergencyPayload } from '../types/emergency';
import type { RegisterRequest } from '../types/auth';
import type { HelpResponsePayload } from '../types/emergency';
import { SmsCommunicationService } from '../services/communication';
import env from '../config/env';

export interface ISmsRepository {
  sendRegistration(data: RegisterRequest): Promise<boolean>;
  sendEmergency(data: CreateEmergencyPayload): Promise<boolean>;
  sendHelpResponse(data: HelpResponsePayload): Promise<boolean>;
  setGatewayNumber(number: string): void;
  setUseNativeSms(use: boolean): void;
}

export class SmsRepository implements ISmsRepository {
  private smsService: SmsCommunicationService;

  constructor() {
    this.smsService = new SmsCommunicationService(
      env.smsGatewayNumber,
      !env.smsGatewayEnabled,
    );
  }

  async sendRegistration(data: RegisterRequest): Promise<boolean> {
    return this.smsService.sendRegistration(data);
  }

  async sendEmergency(data: CreateEmergencyPayload): Promise<boolean> {
    return this.smsService.sendEmergency(data);
  }

  async sendHelpResponse(data: HelpResponsePayload): Promise<boolean> {
    return this.smsService.sendHelpResponse(data);
  }

  setGatewayNumber(number: string): void {
    this.smsService.setSmsGatewayNumber(number);
  }

  setUseNativeSms(use: boolean): void {
    this.smsService.setUseNativeSms(use);
  }
}

export default new SmsRepository();
