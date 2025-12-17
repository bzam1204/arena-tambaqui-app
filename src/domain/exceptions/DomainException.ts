class DomainException extends Error {
  public readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = 'DomainException';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default DomainException;
