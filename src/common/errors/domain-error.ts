export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // ユーザーに表示すべきエラー
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // システムエラー（ログに残すべきエラー）
  REPOSITORY_ERROR = 'REPOSITORY_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class DomainError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
