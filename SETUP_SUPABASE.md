# Supabase + Prisma + Hono + Cloudflare Workers セットアップガイド

このガイドでは、Prisma Accelerate を使用せずに、Supabase の pgbouncer を直接使用して Prisma を設定する方法を説明します。

## 前提条件

- Node.js 18 以上
- pnpm または npm
- Supabase アカウント
- Cloudflare アカウント（本番デプロイ用）

## セットアップ手順

### 1. 依存関係のインストール

```bash
# 既存の node_modules を削除（クリーンインストール推奨）
rm -rf node_modules pnpm-lock.yaml

# 新しい依存関係をインストール
pnpm add @prisma/adapter-pg @prisma/client@^6.7.0 pg
pnpm add -D @types/pg prisma@^6.7.0

# または npm を使用する場合
npm install @prisma/adapter-pg @prisma/client@^6.7.0 pg
npm install -D @types/pg prisma@^6.7.0
```

### 2. Supabase プロジェクトの設定

1. [Supabase ダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択（または新規作成）
3. **Settings** → **Database** に移動
4. 以下の接続情報を取得：
   - **Connection string** セクションから：
     - Transaction pooler (port 6543) の URL
     - Direct connection (port 5432) の URL
   - **Database password** をメモ

### 3. 環境変数の設定

`.dev.vars` ファイルを作成または更新：

```bash
# .dev.vars.supabase.example を参考にして .dev.vars を作成
cp .dev.vars.supabase.example .dev.vars

# エディタで開いて、Supabase の接続情報を設定
```

重要な設定：

```bash
# Transaction pooler URL（アプリケーション用）
# 必ず pgbouncer=true と connection_limit=1 を含める
DATABASE_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Direct connection URL（マイグレーション用）
DIRECT_DATABASE_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 4. Prisma のセットアップ

```bash
# Prisma クライアントを生成
npx prisma generate

# データベーススキーマを確認（pull）
npx prisma db pull

# 既存のマイグレーションがある場合は適用
npx prisma migrate deploy

# 新しいマイグレーションを作成する場合
npx prisma migrate dev --name init
```

### 5. ローカル開発サーバーの起動

```bash
# Wrangler dev サーバーを起動
pnpm dev

# または
npm run dev
```

ブラウザで http://localhost:8787/health にアクセスして動作確認。

### 6. 本番環境へのデプロイ

#### 6.1 シークレットの設定

```bash
# Cloudflare Workers のシークレットを設定
npx wrangler secret put DATABASE_URL
# プロンプトが表示されたら、Transaction pooler URL を入力

npx wrangler secret put DIRECT_DATABASE_URL  
# プロンプトが表示されたら、Direct connection URL を入力

npx wrangler secret put RESEND_API_KEY
# メール送信用の API キーを入力（使用する場合）
```

#### 6.2 デプロイ

```bash
# ステージング環境へデプロイ
pnpm deploy:staging

# 本番環境へデプロイ
pnpm deploy:production
```

## Prisma Client の接続管理戦略

### 推奨アプローチ（コンテナ再利用）

Prisma 公式ドキュメントのサーバーレス環境ベストプラクティスに従い、現在の実装では：

1. **PrismaClient をハンドラーの外側でインスタンス化（キャッシュ）**
2. **`$disconnect()` を明示的に呼ばない**
3. **コンテナが warm の間は接続を再利用**

これにより、接続オーバーヘッドを最小限に抑え、パフォーマンスを向上させます。

### 代替アプローチ（リクエストごとに新規作成）

Cloudflare Workers で "Cannot perform I/O on behalf of a different request" エラーが発生する場合は、`prisma-client-factory-alternative.ts` の実装を使用してください。

```typescript
// ミドルウェアでの使用例
import { PrismaClientFactoryAlternative } from '../persistence/prisma-client-factory-alternative';

// リクエストごとに新しいインスタンスを作成
const prisma = PrismaClientFactoryAlternative.createClient(databaseUrl);
```

このアプローチはより安全ですが、リクエストごとに接続オーバーヘッドが発生します。

## トラブルシューティング

### エラー: "prepared statement 's0' already exists"

**原因**: pgbouncer が transaction モードで prepared statements をサポートしていない。

**解決策**: DATABASE_URL に `?pgbouncer=true` パラメータが含まれていることを確認。

### エラー: "Cannot perform I/O on behalf of a different request"

**原因**: Cloudflare Workers でグローバル変数として Prisma Client を初期化している。

**解決策**: リクエストごとに新しい Prisma Client インスタンスを作成（実装済み）。

### エラー: "Too many connections"

**原因**: 接続プールの枯渇。

**解決策**: 
- DATABASE_URL に `connection_limit=1` が設定されていることを確認
- Supabase ダッシュボードで接続数を監視
- 必要に応じて Supabase プランをアップグレード

### バンドルサイズが大きすぎる

**原因**: Prisma の Rust エンジンが含まれている。

**解決策**:
- `schema.prisma` で `queryCompiler` preview feature が有効になっていることを確認
- `npx prisma generate` を再実行
- `wrangler.toml` で `minify = true` が設定されていることを確認

## パフォーマンス最適化

### 1. クエリの最適化

```typescript
// 悪い例：N+1 問題
const invitations = await prisma.admin_invitations.findMany();
for (const invitation of invitations) {
  const status = await prisma.invitation_statuses.findUnique({
    where: { code: invitation.status_code }
  });
}

// 良い例：include を使用
const invitations = await prisma.admin_invitations.findMany({
  include: { status: true }
});
```

### 2. 選択的なフィールド取得

```typescript
// 必要なフィールドのみを取得
const invitations = await prisma.admin_invitations.findMany({
  select: {
    id: true,
    email: true,
    expires_at: true,
    status: {
      select: {
        label: true
      }
    }
  }
});
```

### 3. バッチ操作の使用

```typescript
// 複数レコードの一括作成
await prisma.admin_invitations.createMany({
  data: invitations
});

// 複数レコードの一括更新
await prisma.admin_invitations.updateMany({
  where: { expires_at: { lt: new Date() } },
  data: { status_code: 'expired' }
});
```

## 監視とメトリクス

### Supabase ダッシュボードでの監視

1. **Database** → **Connection Pooling** で接続プールの使用状況を確認
2. **Database** → **Query Performance** でスロークエリを特定
3. **Database** → **Replication** でレプリケーションラグを監視

### Cloudflare Workers での監視

1. **Workers & Pages** → アプリを選択 → **Analytics** タブ
2. リクエスト数、エラー率、レスポンスタイムを確認
3. `wrangler tail` コマンドでリアルタイムログを確認

## ベストプラクティス

1. **接続管理**
   - 常に `connection_limit=1` を使用
   - リクエスト終了時に必ず `prisma.$disconnect()` を呼ぶ

2. **エラーハンドリング**
   - トランジェントエラーに対するリトライロジックを実装
   - 適切なタイムアウトを設定

3. **セキュリティ**
   - 本番環境では必ず `wrangler secret` を使用
   - データベース接続情報をコードにハードコードしない

4. **開発フロー**
   - ローカル開発では `USE_MOCK_DB=true` を活用
   - ステージング環境でテスト後に本番デプロイ

## 参考リンク

- [Prisma Edge Runtime Documentation](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling)
- [Hono with Cloudflare Workers](https://hono.dev/getting-started/cloudflare-workers)
- [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/platform/best-practices/)

## サポート

問題が解決しない場合は、以下を確認してください：

1. Prisma と関連パッケージが最新バージョンか
2. Supabase の接続制限に達していないか
3. Cloudflare Workers のリソース制限内か

それでも問題が続く場合は、エラーメッセージと設定内容を含めて Issue を作成してください。