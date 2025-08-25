import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import { AppContext } from '../../../../../types/app-context';
import * as handlers from '../../handlers/admin-invitations.handlers';

// https://www.speakeasy.com/openapi/frameworks/hono#configuring-the-middleware-for-each-endpoint
// https://hono.dev/examples/zod-openapi を参考にしました。

// ルーターを作成
const adminInvitationsRouter = new OpenAPIHono<AppContext>();

// // ミドルウェアを適用
// adminInvitationsRouter.use(errorHandler);

// ルートを定義（外部ハンドラーを使用）
// handlers.create は関数そのものへの参照を渡している（実行していない）
adminInvitationsRouter.openapi(routes.create, handlers.create);

export default adminInvitationsRouter;
