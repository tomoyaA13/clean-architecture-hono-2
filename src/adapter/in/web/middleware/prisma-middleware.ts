import { Context, Next } from 'hono';
import { PrismaClient } from '@prisma/client';
import { PrismaClientFactory } from '../../../out/persistence/prisma-client-factory';
import { Bindings } from '../../../../types/bindings';

// Variables に PrismaClient を追加
export type PrismaVariables = {
  prisma: PrismaClient;
};

/**
 * Prismaミドルウェア
 * サーバーレス環境のベストプラクティスに従い、
 * 明示的な$disconnect()は呼ばず、コンテナ再利用を活用
 * 参考: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#do-not-explicitly-disconnect
 */
export async function prismaMiddleware(c: Context<{ Bindings: Bindings; Variables: PrismaVariables }>, next: Next) {
  // モックDBを使用する場合はスキップ
  const useMockDb = c.env.USE_MOCK_DB === 'true';
  if (useMockDb) {
    return next();
  }

  const databaseUrl = c.env.DATABASE_URL;

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
