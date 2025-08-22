import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';
import { Bindings } from '../../../../../types/bindings';
import { AdminInvitationServiceFactory } from '../../../../config/admin-invitation-service-factory';

// リクエストバリデーションスキーマ
const createAdminInvitationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// 管理者招待用のルーター
export const adminInvitationsRouter = new Hono<{ Bindings: Bindings }>();

// POSTリクエストのハンドラー
adminInvitationsRouter.post(
  '/',
  validator('json', (value, c) => {
    const parsed = createAdminInvitationSchema.safeParse(value);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            message: 'バリデーションエラー',
            details: parsed.error.flatten(),
          },
        },
        400,
      );
    }
    return parsed.data;
  }),
  async (c) => {
    // リクエスト毎にコントローラーを作成（ステートレス）
    const controller = AdminInvitationServiceFactory.createPerRequestController(c);
    return await controller.create(c);
  },
);

// 他のエンドポイントも追加可能
adminInvitationsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  // 実装...
  return c.json({ id });
});
