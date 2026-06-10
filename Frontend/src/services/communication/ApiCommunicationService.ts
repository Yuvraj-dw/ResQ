import { BaseCommunicationService } from './CommunicationService';
import type { CreateEmergencyPayload } from '../../types/emergency';
import type { RegisterRequest } from '../../types/auth';
import type { HelpResponsePayload } from '../../types/emergency';

export class ApiCommunicationService extends BaseCommunicationService {
  private apiEndpoint: string;

  constructor(apiEndpoint = 'https://api.emergencyconnect.dev/v1/communication') {
    super();
    this.apiEndpoint = apiEndpoint;
  }

  async sendRegistration(data: RegisterRequest): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendEmergency(data: CreateEmergencyPayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendHelpResponse(data: HelpResponsePayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
