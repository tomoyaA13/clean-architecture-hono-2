# AdminInvitationRepositoryFactory エラーの解決

## 問題

`admin-invitation-service-factory.ts` で以下のエラーが発生していました：

```
TS2339: Property createRepository does not exist on type typeof AdminInvitationRepositoryFactory
```

## 原因

`AdminInvitationRepositoryFactory` クラスに `createRepository` メソッドが存在せず、`create` メソッドのみが定義されていました。

## 解決策

### 1. AdminInvitationRepositoryFactory の更新

`createRepository` メソッドを追加して、`EnvConfig` から直接リポジトリを作成できるようにしました：

```typescript
export class AdminInvitationRepositoryFactory {
  // 既存のメソッド（ミドルウェアから使用）
  static create(useMockDb: boolean, prisma?: PrismaClient): AdminInvitationRepository {
    // ...
  }

  // 新しいメソッド（サービスファクトリーから使用）
  static createRepository(envConfig: EnvConfig): AdminInvitationRepository {
    const config = envConfig.config;
    const useMockDb = config.database.useMockDb;

    if (useMockDb) {
      return new MockAdminInvitationRepository();
    }

    const databaseUrl = config.database.url;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const prisma = PrismaClientFactory.getClient(databaseUrl);
    return new PrismaAdminInvitationRepository(prisma);
  }
}
```

### 2. EnvConfig の更新

新しい環境変数名（`DATABASE_URL`, `DIRECT_DATABASE_URL`）をサポートし、古い名前との後方互換性を保持：

```typescript
// 新旧両方の環境変数名をサポート
DATABASE_URL: env.DATABASE_URL || env.POSTGRES_PRISMA_URL,
DIRECT_DATABASE_URL: env.DIRECT_DATABASE_URL || env.POSTGRES_URL_NON_POOLING,
```

## アーキテクチャ上の考慮事項

### 現在の実装の問題点

`AdminInvitationServiceFactory` はサービスファクトリーパターンを使用していますが、以下の問題があります：

1. **PrismaClient の重複インスタンス**: ミドルウェアとサービスファクトリーで別々のインスタンスを作成
2. **接続管理の分散**: 接続管理が複数箇所に分散

### 推奨されるアプローチ

本来は、Prisma Client はミドルウェアで一元管理されるべきです：

```typescript
// ルートハンドラーでの使用例
app.get('/api/admin-invitations', async (c) => {
  const prisma = c.var.prisma;  // ミドルウェアで設定された PrismaClient
  const envConfig = c.var.envConfig;
  
  const repository = AdminInvitationRepositoryFactory.create(
    envConfig.config.database.useMockDb,
    prisma
  );
  
  // ... ビジネスロジック
});
```

## 現在の状態

- ✅ エラーは解決されました
- ✅ 後方互換性を保持
- ⚠️ `AdminInvitationServiceFactory` は現在使用されていない可能性があります
- 💡 将来的にはミドルウェアベースのアプローチに移行することを推奨

## 次のステップ

1. `AdminInvitationServiceFactory` が実際に使用されているか確認
2. 使用されていない場合は削除を検討
3. 使用されている場合は、ミドルウェアベースのアプローチへの移行を検討