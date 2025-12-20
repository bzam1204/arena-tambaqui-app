export interface CreateTransmissionInput {
  targetId: string;
  type: 'report' | 'praise';
  content: string;
  submitterId: string; // player id (not user id)
  matchId: string;
}

export interface TransmissionGateway {
  createTransmission(input: CreateTransmissionInput): Promise<void>;
}

export const TkTransmissionGateway = Symbol('TransmissionGateway');
