import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import { errorHandler } from '../../middleware/error-handler';
import { AppContext } from '../../../../../types/app-context';
import * as handlers from '../../handlers/admin-invitations.handlers';

// ルーターを作成
const adminInvitationsRouter = new OpenAPIHono<AppContext>();

// ミドルウェアを適用
adminInvitationsRouter.use(errorHandler);

// ルートを定義（外部ハンドラーを使用）
adminInvitationsRouter.openapi(routes.create, handlers.create);

export default adminInvitationsRouter;
