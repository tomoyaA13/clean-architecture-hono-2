import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { Bindings } from './types/bindings';
import { EnvConfig } from './common/env-config';
import { adminInvitationsRouter } from './adapter/in/web/routes/admin-invitations';
import { errorHandler } from './adapter/in/web/middleware/error-handler';
import { DomainError } from './common/errors/domain-error';

// Variables型の定義（リクエストごとの変数）
type Variables = {
  envConfig: EnvConfig;
};

// Honoアプリケーションの作成
const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// グローバルミドルウェア
app.use('*', logger());
app.use('*', timing());
app.use('*', compress());
app.use('*', secureHeaders());

// CORS設定（環境に応じて調整）
app.use('*', async (c, next) => {
  const envConfig = new EnvConfig(c.env);
  const config = envConfig.config;

  const corsMiddleware = cors({
    origin: config.env.isProduction ? [config.email.frontEndUrl] : '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });

  return corsMiddleware(c, next);
});

// 環境変数検証と設定のミドルウェア
app.use('*', async (c, next) => {
  try {
    // 環境変数を検証してVariablesに格納
    const envConfig = new EnvConfig(c.env);
    c.set('envConfig', envConfig);

    // 開発環境では環境設定をログ出力
    if (envConfig.config.env.isDevelopment) {
      console.log('🔧 環境設定が正常に読み込まれました');
    }
  } catch (error) {
    console.error('環境変数の検証に失敗しました:', error);
    return c.json(
      {
        error: {
          message: 'Internal Server Error',
          code: 'ENV_CONFIG_ERROR',
        },
      },
      500,
    );
  }

  await next();
});

// エラーハンドリングミドルウェア
app.onError(errorHandler);

// ヘルスチェックエンドポイント
app.get('/health', (c) => {
  const envConfig = c.get('envConfig');
  return c.json({
    status: 'healthy',
    environment: envConfig.config.env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// APIルーティング
app.route('/api/admin-invitations', adminInvitationsRouter);

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      error: {
        message: 'Not Found',
        code: 'NOT_FOUND',
        path: c.req.path,
      },
    },
    404,
  );
});

// Cloudflare Workersのエクスポート
export default app;
