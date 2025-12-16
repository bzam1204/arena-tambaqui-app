export interface CreateTransmissionInput {
  targetId: string;
  type: 'report' | 'praise';
  content: string;
  submitterName: string;
  submitterCPF: string;
  submitterPhoto?: File | null;
}

export interface TransmissionGateway {
  createTransmission(input: CreateTransmissionInput): Promise<void>;
}

export const TkTransmissionGateway = Symbol('TransmissionGateway');
