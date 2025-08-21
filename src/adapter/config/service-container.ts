// src/adapter/config/service-container.ts
import { Context } from 'hono';
import { Bindings } from '../../types/bindings';
import { EnvConfig } from '../../common/env-config';
import { SendEmailPort } from '../../application/port/out/send-email-port';
import { LoadAdminInvitationPort } from '../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../application/port/out/save-admin-invitation-port';
import { EmailServiceFactory } from '../out/email/email-service-factory';
import { AdminInvitationRepositoryFactory } from '../out/persistence/admin-invitation-repository-factory';
import { AdminInvitationDomainService } from '../../application/domain/service/admin-invitation-domain-service';
import { CreateAdminInvitationApplicationService } from '../../application/service/create-admin-invitation-application-service';

/**
 * サービスコンテナ
 * 依存関係の管理とインスタンスのキャッシュを行う
 */
export class ServiceContainer {
  private readonly services: Map<string, any> = new Map();
  private readonly envConfig: EnvConfig;

  constructor(envConfig: EnvConfig) {
    this.envConfig = envConfig;
  }

  /**
   * 環境設定を取得
   */
  getEnvConfig(): EnvConfig {
    return this.envConfig;
  }

  /**
   * メールサービスを取得（シングルトン）
   */
  getEmailService(): SendEmailPort {
    const key = 'emailService';
    if (!this.services.has(key)) {
      this.services.set(key, EmailServiceFactory.createEmailService(this.envConfig));
    }
    return this.services.get(key);
  }

  /**
   * 管理者招待リポジトリを取得（シングルトン）
   */
  getAdminInvitationRepository(): LoadAdminInvitationPort & SaveAdminInvitationPort {
    const key = 'adminInvitationRepository';
    if (!this.services.has(key)) {
      this.services.set(key, AdminInvitationRepositoryFactory.createRepository(this.envConfig));
    }
    return this.services.get(key);
  }

  /**
   * 管理者招待ドメインサービスを取得（シングルトン）
   */
  getAdminInvitationDomainService(): AdminInvitationDomainService {
    const key = 'adminInvitationDomainService';
    if (!this.services.has(key)) {
      this.services.set(key, new AdminInvitationDomainService());
    }
    return this.services.get(key);
  }

  /**
   * 管理者招待作成ユースケースを取得
   */
  getCreateAdminInvitationUseCase(): CreateAdminInvitationApplicationService {
    const key = 'createAdminInvitationUseCase';
    if (!this.services.has(key)) {
      const useCase = new CreateAdminInvitationApplicationService(
        this.getAdminInvitationDomainService(),
        this.getAdminInvitationRepository(),
        this.getAdminInvitationRepository(),
        this.getEmailService()
      );
      this.services.set(key, useCase);
    }
    return this.services.get(key);
  }

  /**
   * 全てのキャッシュされたサービスをクリア
   * （必要に応じてリクエスト後にクリーンアップ）
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * ファクトリーメソッド：Contextからコンテナを作成
   */
  static fromContext(c: Context<{ Bindings: Bindings }>): ServiceContainer {
    const envConfig = new EnvConfig(c.env);
    return new ServiceContainer(envConfig);
  }
}

/**
 * サービスコンテナをVariablesに追加するミドルウェア
 */
export const serviceContainerMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: { container: ServiceContainer } }>,
  next: () => Promise<void>
) => {
  const container = ServiceContainer.fromContext(c);
  c.set('container', container);
  
  try {
    await next();
  } finally {
    // リクエスト終了後にコンテナをクリア（オプション）
    // container.clear();
  }
};
