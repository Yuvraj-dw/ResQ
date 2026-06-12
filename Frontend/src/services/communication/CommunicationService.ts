import type { CreateEmergencyPayload } from '../../types/emergency';
import type { AppRegisterRequest } from '../../types/auth';

export interface ICommunicationService {
  sendRegistration(data: AppRegisterRequest): Promise<boolean>;
  sendEmergency(data: CreateEmergencyPayload): Promise<boolean>;
}

export abstract class BaseCommunicationService implements ICommunicationService {
  abstract sendRegistration(data: AppRegisterRequest): Promise<boolean>;
  abstract sendEmergency(data: CreateEmergencyPayload): Promise<boolean>;

  protected formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
    return `+91${cleaned}`;
  }
}
