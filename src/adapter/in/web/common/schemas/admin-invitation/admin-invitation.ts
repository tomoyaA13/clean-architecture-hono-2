import { z } from '@hono/zod-openapi';

// https://www.speakeasy.com/openapi/frameworks/hono#adding-openapi-metadata-to-the-zod-schemas を参考にしました。
export const AdminInvitationsCreateSchema = z.object({
  email: z
    .email('有効なメールアドレスを入力してください')
    .min(1, '有効なメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます') // RFC 5321でのSMTPの制限
    .openapi({ example: 'test@exampl.com' }),
});

export const AdminInvitationsCreateSuccessSchema = z
  .object({
    data: z.object({
      message: z.string().openapi({
        description: '処理が成功した場合のメッセージ',
        example: '確認メールを送信しました',
      }),
      email: z.email().openapi({
        description: '招待メールが送信されたアドレス',
        example: 'test@example.com',
      }),
    }),
  })
  .openapi('AdminInvitationsCreateSuccessSchema');
