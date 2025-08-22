import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import { errorHandler } from '../../middleware/error-handler';
import { AppContext } from '../../../../../types/app-context';
import { AdminInvitationServiceFactory } from '../../../../config/admin-invitation-service-factory';
import { DomainError, ErrorType } from '../../../../../common/errors/domain-error';

// ルーターを作成
const adminInvitationsRouter = new OpenAPIHono<AppContext>();

// ミドルウェアを適用
adminInvitationsRouter.use(errorHandler);

// ルートを定義（インラインハンドラー）
adminInvitationsRouter.openapi(routes.create, async (c) => {
  // コントローラーを生成
  const controller = AdminInvitationServiceFactory.createPerRequestController(c);

  // リクエストボディを取得
  const { email } = await c.req.json<{ email: string }>();
  const config = controller.envConfig.config;

  // 環境設定からフロントエンドURLを取得
  const frontendOrigin = config.email.frontEndUrl;

  if (!frontendOrigin) {
    throw new DomainError(ErrorType.CONFIGURATION_ERROR, '招待リンクの生成に必要なフロントエンドURLが設定されていません。');
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
});

export default adminInvitationsRouter;
