import { Context } from 'hono';
import { AdminInvitationServiceFactory } from '../../../config/admin-invitation-service-factory';
import { AppContext } from '../../../../types/app-context';
import { AppRouteHandler } from '../common/app-route-handler';
import { CreateRoute } from '../routes/admin-invitations/routes';

/**
 * 管理者招待ハンドラー
 * コントローラーのメソッドを呼び出すラッパー関数
 * https://www.speakeasy.com/openapi/frameworks/hono#defining-route-handlers
 */
export const create: AppRouteHandler<CreateRoute> = async (c: Context<AppContext>) => {
  // コントローラーを生成
  const controller = AdminInvitationServiceFactory.createPerRequestController(c);

  // コントローラーのcreateメソッドに委譲
  return controller.create(c);
};
