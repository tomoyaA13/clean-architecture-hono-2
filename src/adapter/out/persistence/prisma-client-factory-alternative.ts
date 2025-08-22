// src/adapter/out/persistence/prisma-client-factory-alternative.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * 代替実装：Cloudflare Workers の制約を考慮したバージョン
 * 
 * Cloudflare Workers では、異なるリクエスト間でI/O操作を共有すると
 * "Cannot perform I/O on behalf of a different request" エラーが発生する可能性があります。
 * 
 * この実装は、より安全ですがパフォーマンスは劣る可能性があります。
 * プロジェクトの要件に応じて選択してください。
 */
export class PrismaClientFactoryAlternative {
  /**
   * リクエストごとに新しい PrismaClient インスタンスを作成
   * より安全だが、接続オーバーヘッドが発生する
   */
  static createClient(databaseUrl: string): PrismaClient {
    // Supabase pgbouncer 用の接続設定
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1, // サーバーレス環境では1接続に制限
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    
    return new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    });
  }
}