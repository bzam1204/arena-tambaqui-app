import DomainException from '@/domain/exceptions/DomainException';

export class Cpf {
  private readonly FIRST_DIGIT_FACTOR = 10;
  private readonly SECOND_DIGIT_FACTOR = 11;
  private readonly _value: string;

  constructor(value: string) {
    if (!this.validateCpf(value)) throw new DomainException(Cpf.errorCodes.INVALID_CPF);
    this._value = value.replace(/\D/g, '');
  }

  get value(): string {
    return this._value;
  }

  private validateCpf(cpf: string): boolean {
    cpf = this.removeNonDigits(cpf);
    if (!this.isValidLength(cpf)) return false;
    if (this.isCpfHomogeneous(cpf)) return false;
    const digit1 = this.calculateDigit(cpf, this.FIRST_DIGIT_FACTOR);
    const digit2 = this.calculateDigit(cpf, this.SECOND_DIGIT_FACTOR);
    const checkDigit = this.extractCheckDigits(cpf);
    return checkDigit === `${digit1}${digit2}`;
  }

  private removeNonDigits(cpf: string) {
    return cpf.replace(/\D/g, '');
  }

  private isValidLength(givenCpf: string): boolean {
    return givenCpf.length === 11;
  }

  private isCpfHomogeneous(givenCpf: string): boolean {
    return givenCpf.split('').every((c) => c === givenCpf[0]);
  }

  private calculateDigit(cpf: string, factor: number): number {
    let total = 0;
    for (const digit of cpf) {
      if (factor > 1) {
        total += parseInt(digit) * factor--;
      }
    }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  }

  private extractCheckDigits(cpf: string) {
    return cpf.slice(-2);
  }

  static readonly errorCodes = {
    INVALID_CPF: 'CPF inválido',
  } as const;
}

export default Cpf;
