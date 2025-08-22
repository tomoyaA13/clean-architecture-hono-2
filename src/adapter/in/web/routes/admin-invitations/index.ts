import { Context } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import { errorHandler } from '../../middleware/error-handler';
import { AppContext } from '../../../../../types/app-context';
import { AdminInvitationServiceFactory } from '../../../../config/admin-invitation-service-factory';

// ルートハンドラーをラップする関数
const createHandler = (c: Context<AppContext>) => {
  // リクエスト毎にコントローラーを生成
  const controller = AdminInvitationServiceFactory.createPerRequestController(c);
  // 実際のハンドラーを呼び出し
  return controller.create(c);
};

// ルーターを作成し、ミドルウェア適用とルート定義をチェーン
const adminInvitationsRouter = (new OpenAPIHono<AppContext>().use(errorHandler) as OpenAPIHono<AppContext>).openapi(
  routes.create,
  createHandler,
);

export default adminInvitationsRouter;
