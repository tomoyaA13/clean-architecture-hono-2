import { Context } from 'hono';
import type { CreateRoute } from '../routes/admin-invitations/routes';
import { AdminInvitationServiceFactory } from '../../../config/admin-invitation-service-factory';
import { AppContext } from '../../../../types/app-context';

/**
 * 管理者招待ハンドラー
 * 型を明示的に指定せず、直接関数として定義
 */
export const create = async (c: Context<AppContext>) => {
  // コントローラーを生成
  const controller = AdminInvitationServiceFactory.createPerRequestController(c);
  
  // コントローラーのcreateメソッドを実行
  const { email } = await c.req.json<{ email: string }>();
  const config = controller.envConfig.config;

  // 環境設定からフロントエンドURLを取得
  const frontendOrigin = config.email.frontEndUrl;

  if (!frontendOrigin) {
    throw new Error('招待リンクの生成に必要なフロントエンドURLが設定されていません。');
  }

  // UseCase に frontendOrigin を渡して招待を作成
  const result = await controller.createAdminInvitationUseCase.createInvitation({
    email,
    frontendOrigin: frontendOrigin,
  });

  return c.json(
    {
      data: {
        message: '確認メールを送信しました',
        email: result.invitation.email,
      },
    },
    201,
  );
};
