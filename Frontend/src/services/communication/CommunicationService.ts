import type { CreateEmergencyPayload } from '../../types/emergency';
import type { RegisterRequest } from '../../types/auth';
import type { HelpResponsePayload } from '../../types/emergency';

export interface ICommunicationService {
  sendRegistration(data: RegisterRequest): Promise<boolean>;
  sendEmergency(data: CreateEmergencyPayload): Promise<boolean>;
  sendHelpResponse(data: HelpResponsePayload): Promise<boolean>;
}

export abstract class BaseCommunicationService implements ICommunicationService {
  abstract sendRegistration(data: RegisterRequest): Promise<boolean>;
  abstract sendEmergency(data: CreateEmergencyPayload): Promise<boolean>;
  abstract sendHelpResponse(data: HelpResponsePayload): Promise<boolean>;

  protected formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
    return `+91${cleaned}`;
  }
}
