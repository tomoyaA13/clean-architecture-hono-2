import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from '../routes/admin-invitations.routes';
import { AppContext } from '../../../../types/app-context';
import * as handlers from '../handlers/admin-invitations.handlers';

// https://www.speakeasy.com/openapi/frameworks/hono#configuring-the-middleware-for-each-endpoint
// https://hono.dev/examples/zod-openapi を参考にしました。

/**
 * 管理者招待機能のルーター
 * OpenAPIHonoインスタンスを作成し、ルート定義とハンドラーを結合
 */
const adminInvitationsRouter = new OpenAPIHono<AppContext>();

// ルートとハンドラーの結合
// routes.create: OpenAPIスキーマ定義（仕様）
// handlers.create: 実際の処理を行う関数（実装）
adminInvitationsRouter.openapi(routes.create, handlers.create);

export default adminInvitationsRouter;
