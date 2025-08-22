# Prisma Driver Adapters の詳細解説

## なぜ Driver Adapters が必要なのか？

### 従来の Prisma アーキテクチャの問題点

```
[アプリケーション]
       ↓
[Prisma Client (JavaScript)]
       ↓
[Query Engine (Rust バイナリ)]  ← ❌ Cloudflare Workers で動作しない
       ↓
[データベース]
```

**問題点**:
- Rust 製のバイナリエンジンが必要
- エッジランタイムでは実行不可
- バンドルサイズが大きい（数MB）

### Driver Adapters を使用した新しいアーキテクチャ

```
[アプリケーション]
       ↓
[Prisma Client (JavaScript)]
       ↓
[Driver Adapter (PrismaPg)]  ← ✅ Pure JavaScript
       ↓
[Database Driver (pg)]       ← ✅ Node.js 互換
       ↓
[データベース (Supabase)]
```

## コードの詳細解説

### 1. Pool の設定（pg ドライバー）

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,                      // 接続プールの最大サイズ
  idleTimeoutMillis: 0,        // アイドル接続のタイムアウト（0 = 無制限）
  connectionTimeoutMillis: 10000, // 接続確立のタイムアウト（10秒）
});
```

**各パラメータの意味**:

- `max: 1`: 
  - サーバーレス環境では接続数を最小限に
  - 複数の Lambda/Worker が同時実行される可能性があるため

- `idleTimeoutMillis: 0`:
  - アイドル接続を維持（コンテナ再利用のため）
  - 0 にすることで接続を閉じない

- `connectionTimeoutMillis: 10000`:
  - 接続確立に10秒以上かかる場合はエラー
  - ネットワーク問題の早期検出

### 2. PrismaPg アダプターの役割

```typescript
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(pool);
```

**アダプターの機能**:

1. **クエリ変換**:
   ```typescript
   // Prisma のクエリ
   prisma.user.findMany({ where: { age: { gte: 18 } } })
   
   // ↓ アダプターが変換
   
   // PostgreSQL の SQL
   SELECT * FROM "user" WHERE age >= 18
   ```

2. **結果のマッピング**:
   ```typescript
   // PostgreSQL の結果
   [{ id: 1, created_at: '2024-01-01' }]
   
   // ↓ アダプターが変換
   
   // Prisma の型付きオブジェクト
   [{ id: 1, createdAt: Date }]
   ```

### 3. Prisma Client の初期化

```typescript
const prisma = new PrismaClient({ 
  adapter,  // ← ここでアダプターを指定
  log: ['query', 'error', 'warn']
});
```

## Supabase pgbouncer との統合

### なぜ pgbouncer が必要？

```
[多数の Worker インスタンス]
       ↓
[pgbouncer (接続プーラー)]  ← 接続を集約
       ↓
[PostgreSQL (限られた接続数)]
```

### 接続文字列の構成

```javascript
// Transaction pooler を使用（pgbouncer 経由）
const DATABASE_URL = `
  postgres://postgres.[PROJECT-REF]:[PASSWORD]@
  aws-0-[REGION].pooler.supabase.com:6543/postgres
  ?pgbouncer=true          // ← prepared statements を無効化
  &connection_limit=1      // ← 接続数を制限
`.replace(/\s+/g, '');
```

**パラメータの重要性**:

- `pgbouncer=true`:
  - prepared statements を無効化
  - pgbouncer の transaction モードで必須

- `connection_limit=1`:
  - Worker あたりの接続数を制限
  - データベースの接続枯渇を防ぐ

## パフォーマンスへの影響

### メリット

1. **エッジでの実行**:
   - Cloudflare Workers で動作可能
   - ユーザーに近い場所で処理

2. **バンドルサイズの削減**:
   - Rust エンジン不要（数MB → 数百KB）
   - 起動時間の短縮

3. **接続の効率化**:
   - pgbouncer による接続プーリング
   - リソースの最適利用

### デメリット

1. **prepared statements の無効化**:
   - クエリのパフォーマンスがわずかに低下
   - SQL インジェクション対策は Prisma 側で実施

2. **接続数の制限**:
   - 並列クエリの制限
   - `Promise.all()` での複数クエリに注意

## トラブルシューティング

### エラー: "Cannot find module 'pg'"

```bash
# pg ドライバーをインストール
pnpm add pg
pnpm add -D @types/pg
```

### エラー: "Cannot find module '@prisma/adapter-pg'"

```bash
# アダプターをインストール
pnpm add @prisma/adapter-pg
```

### エラー: "queryCompiler is not enabled"

```prisma
// schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]  // ← 両方必要
}
```

### wrangler.toml の設定

```toml
# Node.js 互換性を有効化（pg ドライバー用）
node_compat = true
```

## ベストプラクティス

1. **接続数は最小限に**:
   ```typescript
   max: 1  // サーバーレス環境では 1 が推奨
   ```

2. **エラーハンドリング**:
   ```typescript
   try {
     const result = await prisma.user.findMany();
   } catch (error) {
     if (error.code === 'P2024') {
       // プール タイムアウト
       console.error('Connection pool timeout');
     }
   }
   ```

3. **監視とログ**:
   ```typescript
   new PrismaClient({
     adapter,
     log: process.env.NODE_ENV === 'production' 
       ? ['error'] 
       : ['query', 'error', 'warn']
   });
   ```

## まとめ

Driver Adapters により：
- ✅ Cloudflare Workers での Prisma 実行が可能
- ✅ バンドルサイズの大幅削減
- ✅ エッジコンピューティングの実現
- ✅ Supabase pgbouncer との完全な互換性

これらの技術の組み合わせにより、スケーラブルでパフォーマンスの高いサーバーレスアプリケーションの構築が可能になります。