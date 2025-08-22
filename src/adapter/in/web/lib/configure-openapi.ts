import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from '../../../../types/app-context';

/**
 * OpenAPIドキュメントの設定
 */
export const openAPIObjectConfig = {
  openapi: '3.1.0' as const,
  info: {
    version: '1.0.0',
    title: 'Clean Architecture Hono API',
    description: 'クリーンアーキテクチャで実装されたHono API',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: 'Development server (Cloudflare Workers)',
    },
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'admin-invitations',
      description: '管理者招待に関するエンドポイント',
    },
  ],
  externalDocs: {
    description: 'プロジェクトのドキュメント',
    url: 'https://github.com/yourusername/clean-architecture-hono-2',
  },
  // Speakeasy拡張：リトライ戦略
  'x-speakeasy-retries': {
    strategy: 'backoff',
    backoff: {
      initialInterval: 500,
      maxInterval: 60000,
      maxElapsedTime: 3600000,
      exponent: 1.5,
    },
    statusCodes: ['5XX'],
    retryConnectionErrors: true,
  },
};

/**
 * OpenAPIドキュメントを設定する関数
 * @param app OpenAPIHonoインスタンス
 */
export default function configureOpenAPI(app: OpenAPIHono<AppContext>) {
  // OpenAPI 3.1 ドキュメントをJSON形式で公開
  app.doc31('/doc', openAPIObjectConfig);

  // OpenAPI 3.0 ドキュメント（互換性のため）
  // app.doc('/doc-v3', openAPIObjectConfig);
}
