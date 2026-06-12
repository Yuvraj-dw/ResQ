import { BaseCommunicationService } from './CommunicationService';
import type { CreateEmergencyPayload } from '../../types/emergency';
import type { AppRegisterRequest } from '../../types/auth';
import { SMS_PAYLOAD_PREFIX } from '../../utils/constants';
import { Linking, Platform } from 'react-native';

export class SmsCommunicationService extends BaseCommunicationService {
  private smsGatewayNumber: string;
  private useNativeSms: boolean;

  constructor(smsGatewayNumber = '+1234567890', useNativeSms = true) {
    super();
    this.smsGatewayNumber = smsGatewayNumber;
    this.useNativeSms = useNativeSms;
  }

  async sendRegistration(data: AppRegisterRequest): Promise<boolean> {
    const smsBody = [
      SMS_PAYLOAD_PREFIX.REGISTRATION,
      `Name: ${data.name}`,
      `Blood: ${data.blood_group}`,
      `Location: ${data.location_name}`,
      `Resources: ${data.resources.join(', ')}`,
      `Mobile: ${data.phone}`,
    ].join('\n');

    return this.sendSms(smsBody);
  }

  async sendEmergency(data: CreateEmergencyPayload): Promise<boolean> {
    const smsBody = [
      SMS_PAYLOAD_PREFIX.EMERGENCY,
      `Resource: ${data.resource}`,
      `Urgency: ${data.urgency}`,
      `Location: ${data.location_name}`,
      `Lat: ${data.latitude}`,
      `Lng: ${data.longitude}`,
    ].join('\n');

    return this.sendSms(smsBody);
  }

  private async sendSms(body: string): Promise<boolean> {
    try {
      if (this.useNativeSms) {
        const smsUrl = Platform.select({
          ios: `sms:${this.smsGatewayNumber}&body=${encodeURIComponent(body)}`,
          android: `sms:${this.smsGatewayNumber}?body=${encodeURIComponent(body)}`,
          default: `sms:${this.smsGatewayNumber}?body=${encodeURIComponent(body)}`,
        });
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
          return true;
        }
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  setSmsGatewayNumber(number: string): void {
    this.smsGatewayNumber = number;
  }

  setUseNativeSms(use: boolean): void {
    this.useNativeSms = use;
  }
}
