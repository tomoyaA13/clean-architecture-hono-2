import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Cloudflare Workers でのコンテナ再利用を考慮した実装
// 参考: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#serverless-environments-faas

let cachedPrisma: PrismaClient | undefined;

export class PrismaClientFactory {
  /**
   * PrismaClient インスタンスを取得
   * サーバーレス環境のベストプラクティスに従い、可能な限り接続を再利用
   */
  static getClient(databaseUrl: string): PrismaClient {
    // 既存のインスタンスがあれば再利用（コンテナが warm の間）
    if (cachedPrisma) {
      return cachedPrisma;
    }

    // Supabase pgbouncer 用の接続設定
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1, // サーバーレス環境では1接続に制限
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);

    cachedPrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    return cachedPrisma;
  }

  /**
   * キャッシュをクリア（テスト用）
   */
  static clearCache(): void {
    cachedPrisma = undefined;
  }
}
