// src/adapter/in/web/middleware/error-handler.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { DomainError, ErrorType } from '../../../../common/errors/domain-error';
import { Bindings } from '../../../../types/bindings';

/**
 * グローバルエラーハンドラー
 */
export const errorHandler = (error: Error, c: Context<{ Bindings: Bindings }>) => {
  console.error('Error occurred:', error);

  // Honoの HTTPException
  if (error instanceof HTTPException) {
    return c.json({
      error: {
        message: error.message,
        code: 'HTTP_EXCEPTION',
      }
    }, error.status);
  }

  // ドメインエラー
  if (error instanceof DomainError) {
    const statusCode = getStatusCodeFromErrorType(error.type);
    
    return c.json({
      error: {
        message: error.message,
        code: error.type,
        ...(error.details && { details: error.details }),
      }
    }, statusCode);
  }

  // Zodバリデーションエラー
  if (error instanceof ZodError) {
    return c.json({
      error: {
        message: 'バリデーションエラー',
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      }
    }, 400);
  }

  // その他の予期しないエラー
  const isDevelopment = c.env.NODE_ENV === 'development';
  
  return c.json({
    error: {
      message: isDevelopment ? error.message : 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    }
  }, 500);
};

/**
 * エラータイプからHTTPステータスコードを取得
 */
function getStatusCodeFromErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.INVALID_INPUT:
      return 400;
    case ErrorType.UNAUTHORIZED:
      return 401;
    case ErrorType.FORBIDDEN:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.CONFLICT:
      return 409;
    case ErrorType.CONFIGURATION_ERROR:
    case ErrorType.INTERNAL_ERROR:
    default:
      return 500;
  }
}
