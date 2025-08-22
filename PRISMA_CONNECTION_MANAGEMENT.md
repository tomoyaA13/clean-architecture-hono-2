# Prisma Client 接続管理の実装について

## 実装の変更点

Prisma 公式ドキュメントの[サーバーレス環境ベストプラクティス](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#serverless-environments-faas)に基づいて、以下の変更を行いました：

### 主な変更

1. **$disconnect() を呼ばない**
   - 以前: リクエスト終了時に `prisma.$disconnect()` を呼んでいた
   - 現在: コンテナ再利用のため、明示的な切断は行わない

2. **PrismaClient のキャッシュ**
   - 以前: リクエストごとに新しいインスタンスを作成
   - 現在: キャッシュされたインスタンスを再利用

### なぜこの変更が重要か

#### パフォーマンスの向上
- 新しい接続を確立するオーバーヘッドを削減
- warm コンテナで接続を再利用することで応答時間を短縮

#### Prisma 公式の推奨事項
ドキュメントには明確に記載されています：
> "You do not need to explicitly $disconnect() at the end of a function, as there is a possibility that the container might be reused."

### 実装の詳細

#### PrismaClientFactory (`prisma-client-factory.ts`)
```typescript
let cachedPrisma: PrismaClient | undefined;

export class PrismaClientFactory {
  static getClient(databaseUrl: string): PrismaClient {
    // キャッシュがあれば再利用
    if (cachedPrisma) {
      return cachedPrisma;
    }
    
    // 新規作成してキャッシュ
    cachedPrisma = new PrismaClient({ ... });
    return cachedPrisma;
  }
}
```

#### Prismaミドルウェア (`prisma-middleware.ts`)
```typescript
export async function prismaMiddleware(c, next) {
  // PrismaClient を取得（キャッシュから）
  const prisma = PrismaClientFactory.getClient(databaseUrl);
  c.set('prisma', prisma);
  
  // $disconnect() は呼ばない
  await next();
}
```

### Cloudflare Workers の特殊性

Cloudflare Workers では、グローバル変数の扱いに制限があるため、エラーが発生する可能性があります：
- "Cannot perform I/O on behalf of a different request"

このような場合は、代替実装（`prisma-client-factory-alternative.ts`）を使用してください。

### 接続プールの設定

引き続き以下の設定は重要です：
- `connection_limit=1`: サーバーレス環境での接続数制限
- `pgbouncer=true`: prepared statements の無効化

### まとめ

この実装変更により：
- ✅ Prisma 公式のベストプラクティスに準拠
- ✅ パフォーマンスの向上（接続再利用）
- ✅ サーバーレス環境に最適化
- ✅ Supabase pgbouncer との互換性維持

問題が発生した場合は、代替実装に切り替えることで対応可能です。