import { Context } from 'hono';
import { AdminInvitationsController } from '../in/web/controllers/admin-invitation-controller';
import { CreateAdminInvitationApplicationService } from '../../application/service/create-admin-invitation-application-service';
import { AdminInvitationDomainService } from '../../application/domain/service/admin-invitation-domain-service';
import { EmailServiceFactory } from '../out/email/email-service-factory';
import { AdminInvitationRepositoryFactory } from '../out/persistence/admin-invitation-repository-factory';
import { AppContext } from '../../types/app-context';

/**
 * Cloudflare Workers環境用のファクトリー
 * Context経由で環境変数とPrismaClientにアクセスし、依存関係を構築
 */
export class AdminInvitationServiceFactory {
  /**
   * リクエスト毎に新しいコントローラーインスタンスを作成
   * PrismaClientはミドルウェアで管理されたものを使用
   *
   * @param c Hono Context（envConfig と prisma が設定済み）
   * @returns AdminInvitationsController インスタンス
   */
  static createPerRequestController(c: Context<AppContext>): AdminInvitationsController {
    const envConfig = c.var.envConfig;
    const prisma = c.var.prisma;

    if (!envConfig) {
      throw new Error('EnvConfig is not set. Ensure env-config middleware is applied.');
    }

    const config = envConfig.config;

    // 1. ドメインサービス（外部依存なし）
    const adminInvitationDomainService = new AdminInvitationDomainService();

    // 2. リポジトリとメールサービス（外部リソース）
    const emailService = EmailServiceFactory.createEmailService(envConfig);

    // PrismaClientをミドルウェアから取得して使用
    const repository = AdminInvitationRepositoryFactory.create(
      config.database.useMock,
      prisma, // ミドルウェアで管理されたPrismaClientを使用
    );

    // 3. アプリケーションサービス（ユースケース実装）
    const createAdminInvitationUseCase = new CreateAdminInvitationApplicationService(
      adminInvitationDomainService,
      repository,
      repository,
      emailService,
    );

    // 4. コントローラー（入力アダプター）
    return new AdminInvitationsController(createAdminInvitationUseCase, envConfig);
  }
}
