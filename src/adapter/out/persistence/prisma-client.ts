// src/adapter/out/persistence/prisma-client.ts
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

/**
 * Cloudflare Workers用のPrismaクライアント
 * Prisma Data ProxyまたはPrisma Accelerateを使用
 */
export class PrismaClientFactory {
  private static instances: Map<string, PrismaClient> = new Map();

  /**
   * Prismaクライアントを取得または作成
   * @param databaseUrl データベース接続URL（Prisma Data Proxy URL）
   */
  static getClient(databaseUrl: string): PrismaClient {
    if (!this.instances.has(databaseUrl)) {
      // Cloudflare Workers環境用の設定
      const client = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        // エッジランタイム用の設定
        log: ['error', 'warn'],
      }).$extends(withAccelerate()) as unknown as PrismaClient;

      this.instances.set(databaseUrl, client);
    }

    return this.instances.get(databaseUrl)!;
  }

  /**
   * 全てのクライアントインスタンスを切断
   */
  static async disconnectAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(client => 
      client.$disconnect()
    );
    await Promise.all(promises);
    this.instances.clear();
  }
}
