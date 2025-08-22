import { Context, Next } from 'hono';
import { PrismaClientFactory } from '../../../out/persistence/prisma-client-factory';
import { AppContext } from '../../../../types/app-context';

/**
 * Prismaミドルウェア
 * サーバーレス環境のベストプラクティスに従い、
 * 明示的な$disconnect()は呼ばず、コンテナ再利用を活用
 * 参考: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#do-not-explicitly-disconnect
 */
export async function prismaMiddleware(c: Context<AppContext>, next: Next) {
  const envConfig = c.var.envConfig;

  if (!envConfig) {
    throw new Error('EnvConfig is not set. Ensure env-config middleware runs before prisma middleware.');
  }

  // モックDBを使用する場合はスキップ
  const useMockDb = envConfig.config.database.useMock;
  if (useMockDb) {
    return next();
  }

  const databaseUrl = envConfig.config.database.url;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  // PrismaClient インスタンスを取得（キャッシュされたものを再利用）
  const prisma = PrismaClientFactory.getClient(databaseUrl);

  // Context に Prisma Client を設定
  c.set('prisma', prisma);

  // 次のミドルウェア/ハンドラーを実行
  // 注意: $disconnect() は呼ばない（コンテナ再利用のため）
  await next();
}
