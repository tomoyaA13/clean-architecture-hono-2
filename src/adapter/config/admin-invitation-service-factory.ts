// src/adapter/config/admin-invitation-service-factory.ts
import { Context } from 'hono';
import { AdminInvitationsController } from '../in/web/controllers/admin-invitation-controller';
import { CreateAdminInvitationApplicationService } from '../../application/service/create-admin-invitation-application-service';
import { AdminInvitationDomainService } from '../../application/domain/service/admin-invitation-domain-service';
import { Bindings } from '../../types/bindings';
import { EnvConfig } from '../../common/env-config';
import { EmailServiceFactory } from '../out/email/email-service-factory';
import { AdminInvitationRepositoryFactory } from '../out/persistence/admin-invitation-repository-factory';

/**
 * Cloudflare Workers環境用のファクトリー
 * Context経由で環境変数にアクセスし、依存関係を構築
 */
export class AdminInvitationServiceFactory {
  /**
   * コントローラーとその依存関係を作成
   * @param envConfig 環境設定オブジェクト
   */
  static createAdminInvitationsController(envConfig: EnvConfig): AdminInvitationsController {
    const config = envConfig.config;
    
    // 1. ドメインサービス（外部依存なし）
    const adminInvitationDomainService = new AdminInvitationDomainService();

    // 2. リポジトリとメールサービス（外部リソース）
    const emailService = EmailServiceFactory.createEmailService(envConfig);
    const repository = AdminInvitationRepositoryFactory.createRepository(envConfig);

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

  /**
   * リクエスト毎に新しいインスタンスを作成する場合のファクトリーメソッド
   * （ステートレスな設計を保証）
   */
  static createPerRequestController(c: Context<{ Bindings: Bindings }>): AdminInvitationsController {
    const envConfig = new EnvConfig(c.env);
    return this.createAdminInvitationsController(envConfig);
  }
}
