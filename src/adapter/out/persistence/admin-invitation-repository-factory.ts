// src/adapter/out/persistence/admin-invitation-repository-factory.ts
import { LoadAdminInvitationPort } from '../../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../../application/port/out/save-admin-invitation-port';
import { PrismaAdminInvitationRepository } from './prisma-admin-invitation-repository';
import { MockAdminInvitationRepository } from './mock-admin-invitation-repository';
import { RepositoryTestSupport } from '../../../application/port/out/repository-test-support';
import { EnvConfig } from '../../../common/env-config';

export class AdminInvitationRepositoryFactory {
  /**
   * 環境設定に基づいて適切なリポジトリ実装を返す
   * @param envConfig 環境設定オブジェクト
   */
  static createRepository(
    envConfig: EnvConfig
  ): LoadAdminInvitationPort & SaveAdminInvitationPort & RepositoryTestSupport<string[]> {
    const config = envConfig.config;
    
    // 環境設定からモックを使用するかどうかを判断
    if (config.database.useMock) {
      console.log('🔄 Using Mock AdminInvitationRepository');
      return new MockAdminInvitationRepository();
    } else {
      console.log('🔄 Using Prisma AdminInvitationRepository');
      
      // Cloudflare Workers環境でPrismaを使う場合の接続設定
      // Prisma Data Proxyを使用することを推奨
      const databaseUrl = config.database.url;
      if (!databaseUrl) {
        throw new Error('Database URL is required when not using mock');
      }
      
      // Prismaクライアントに接続情報を渡す
      return new PrismaAdminInvitationRepository(databaseUrl);
    }
  }
}
