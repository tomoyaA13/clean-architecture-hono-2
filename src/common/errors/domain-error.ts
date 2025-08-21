// src/common/errors/domain-error.ts
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class DomainError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
