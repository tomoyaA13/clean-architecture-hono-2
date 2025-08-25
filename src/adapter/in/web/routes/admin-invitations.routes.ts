import { createRoute } from '@hono/zod-openapi';
import { AdminInvitationsCreateSchema, AdminInvitationsCreateSuccessSchema } from '../common/schemas/admin-invitation/admin-invitation';
import { createErrorResponseSchema } from '../common/schemas/create-error-response-schema';

/**
 * https://www.speakeasy.com/openapi/frameworks/hono#defining-routes を参考にしました。
 * Let’s split the routes and handlers into separate files for better code organization.
 */
export const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['admin-invitations'],
  summary: '管理者登録のレコードを作成',
  description:
    '管理者として登録したいユーザーがメールアドレスを入力して、招待を作成し、そのユーザーのメールアドレスにトークン付きの招待を送信',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AdminInvitationsCreateSchema,
        },
      },
      description: '管理者として登録したいユーザーのメールアドレス',
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AdminInvitationsCreateSuccessSchema } },
      description: '管理者登録のための招待を作成し、ユーザーのメールアドレスに招待を送信',
    },
    // 修正: 400 の定義を一つにまとめる
    400: {
      content: {
        'application/json': {
          // スキーマを createErrorResponseSchema に変更し、両方のケースをカバー
          // (バリデーションエラーの詳細は errorHandler で details に詰める想定)
          schema: createErrorResponseSchema({
            exampleMessage: 'リクエストが不正です。', // より汎用的なメッセージ
            exampleCode: 'INVALID_PARAMETER', // または 'VALIDATION_ERROR'
          }),
        },
      },
      // description を修正して両方のケースを説明
      description: 'リクエストボディのバリデーションエラー、またはパラメータに関するドメインルール違反 (例: メール形式、URL形式)',
    },
    // 追加: DomainError(RESOURCE_ALREADY_EXISTS) 用の 409
    409: {
      content: {
        'application/json': {
          schema: createErrorResponseSchema({
            exampleMessage: '指定されたメールアドレスは既に使用されています。',
            exampleCode: 'ALREADY_EXISTS',
          }),
        },
      },
      description: 'リソースが既に存在します (例: メールアドレス重複)',
    },
    // 追加: DomainError(BUSINESS_RULE_VIOLATION) 用の 422
    422: {
      content: {
        'application/json': {
          schema: createErrorResponseSchema({
            exampleMessage: '招待数の上限に達しています。', // 例
            exampleCode: 'BUSINESS_RULE_VIOLATION',
          }),
        },
      },
      description: 'ビジネスルール違反 (例: 招待上限超過)',
    },
    500: {
      content: {
        'application/json': {
          schema: createErrorResponseSchema({
            exampleMessage: '予期せぬエラーが発生しました',
            exampleCode: 'INTERNAL_SERVER_ERROR',
          }),
        },
      },
      description: '内部サーバーエラー',
    },
    502: {
      content: {
        'application/json': {
          schema: createErrorResponseSchema({
            exampleMessage: 'メール送信サービスとの連携に失敗しました。', // より具体的に
            exampleCode: 'EXTERNAL_SERVICE_ERROR', // errorHandler のコードに合わせる
          }),
        },
      },
      description: '外部サービス（Supabase、メール送信など）との通信エラー',
    },
    503: {
      content: {
        'application/json': {
          schema: createErrorResponseSchema({
            exampleMessage: 'サイトURLが設定されていません',
            exampleCode: 'CONFIGURATION_ERROR',
          }),
        },
      },
      description: '一時的にサービスが利用できない',
    },
  },
});

export type CreateRoute = typeof create;
