import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { AppContext } from './types/app-context';
import { EnvConfig } from './common/env-config';
import adminInvitationsRouter from './adapter/in/web/routes/admin-invitations';
import { errorHandler } from './adapter/in/web/middleware/error-handler';
import { prismaMiddleware } from './adapter/in/web/middleware/prisma-middleware';
import configureOpenAPI from './adapter/in/web/lib/configure-openapi';

// OpenAPIHonoアプリケーションの作成（通常のHonoではなく）
const app = new OpenAPIHono<AppContext>();

// グローバルミドルウェア
app.use('*', logger());
app.use('*', timing()); // https://hono.dev/docs/middleware/builtin/timing
app.use('*', secureHeaders()); // https://hono.dev/docs/middleware/builtin/secure-headers

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

    // 次のミドルウェアに処理を渡す
    return await next();
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
});

// Prisma ミドルウェア（API ルートのみ）
// 注意: envConfig ミドルウェアの後に適用する必要がある
app.use('/api/*', prismaMiddleware);

// エラーハンドリングミドルウェア
app.onError(errorHandler);

// OpenAPIドキュメントの設定
configureOpenAPI(app);

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
