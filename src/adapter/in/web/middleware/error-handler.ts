import { Context, Next } from 'hono';
import { ErrorHandler } from 'hono/types';
import { getEnvConfig } from '../../../../common/env-config';
import { DomainError, ErrorType } from '../../../../common/errors/domain-error';
import { createErrorResponse } from '../../../../common/create-error-response';
import { AppContext } from '../../../../types/app-context';

/**
 * 通常のミドルウェアとして使用するエラーハンドラー
 * try-catchでラップして、エラーをキャッチする
 */
export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    return await next();
  } catch (error) {
    return handleError(error, c);
  }
}

/**
 * app.onError()用のエラーハンドラー
 * Honoのグローバルエラーハンドラーとして使用
 */
export const globalErrorHandler: ErrorHandler<AppContext> = (err, c) => {
  return handleError(err, c);
};

/**
 * 共通のエラー処理ロジック
 */
function handleError(error: unknown, c: Context) {
  // 開発環境では詳細なエラー情報を表示
  if (getEnvConfig(c).config.env.isDevelopment) {
    console.error('Unhandled error details:', error);
  } else {
    // 本番環境では最小限のエラー情報のみ表示
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
  }

  if (error instanceof DomainError) {
    // DomainErrorの場合は適切なHTTPステータスとレスポンスに変換
    switch (error.type) {
      case ErrorType.INVALID_PARAMETER:
        return c.json(
          {
            error: createErrorResponse(error.message, 'INVALID_PARAMETER'),
          },
          400,
        );

      case ErrorType.RESOURCE_NOT_FOUND:
        return c.json(
          {
            error: createErrorResponse(error.message, 'NOT_FOUND'),
          },
          404,
        );

      case ErrorType.RESOURCE_ALREADY_EXISTS:
        return c.json(
          {
            error: createErrorResponse(error.message, 'ALREADY_EXISTS'),
          },
          409,
        );

      case ErrorType.BUSINESS_RULE_VIOLATION:
        return c.json(
          {
            error: createErrorResponse(error.message, 'BUSINESS_RULE_VIOLATION'),
          },
          422,
        );

      case ErrorType.UNAUTHORIZED:
        return c.json(
          {
            error: createErrorResponse(error.message, 'UNAUTHORIZED'),
          },
          401,
        );

      case ErrorType.FORBIDDEN:
        return c.json(
          {
            error: createErrorResponse(error.message, 'FORBIDDEN'),
          },
          403,
        );

      case ErrorType.EXTERNAL_SERVICE_ERROR:
        return c.json(
          {
            error: createErrorResponse('外部サービスとの通信に問題が発生しました', 'EXTERNAL_SERVICE_ERROR'),
          },
          502,
        );

      case ErrorType.CONFIGURATION_ERROR:
        return c.json(
          {
            error: createErrorResponse('サイトURLが設定されていません', 'CONFIGURATION_ERROR'),
          },
          503,
        );

      case ErrorType.REPOSITORY_ERROR:
        return c.json(
          {
            error: createErrorResponse('データ操作中にエラーが発生しました', 'DATABASE_ERROR'),
          },
          500,
        );

      case ErrorType.UNKNOWN_ERROR:
      default:
        return c.json(
          {
            error: createErrorResponse('予期せぬエラーが発生しました', 'INTERNAL_SERVER_ERROR'),
          },
          500,
        );
    }
  }

  // DomainError以外のエラーは内部エラーとして扱う
  return c.json(
    {
      error: createErrorResponse('予期せぬエラーが発生しました', 'INTERNAL_SERVER_ERROR'),
    },
    500,
  );
}

// 後方互換性のため、デフォルトエクスポートとして従来の名前を維持
export const errorHandler = errorHandlerMiddleware;
