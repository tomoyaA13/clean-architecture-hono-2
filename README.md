# Clean Architecture with Hono and Cloudflare Workers

クリーンアーキテクチャパターンを使用した、Hono + Cloudflare Workersアプリケーションです。

## プロジェクト構造

```
src/
├── index.ts                    # メインアプリケーションエントリポイント
├── types/
│   └── bindings.ts            # Cloudflare Workers環境変数の型定義
├── common/
│   ├── env-config.ts          # 環境変数管理
│   └── errors/
│       └── domain-error.ts    # ドメインエラー定義
├── domain/
│   └── model/
│       └── admin-invitation.ts # ドメインモデル
├── application/
│   ├── port/
│   │   ├── in/                # 入力ポート（ユースケース）
│   │   └── out/               # 出力ポート（外部サービス）
│   ├── service/               # アプリケーションサービス
│   └── domain/
│       └── service/           # ドメインサービス
└── adapter/
    ├── config/                # ファクトリー設定
    ├── in/
    │   └── web/              # Webアダプター（コントローラー、ルート）
    └── out/
        ├── email/            # メールサービス実装
        └── persistence/      # リポジトリ実装
```

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.dev.vars`ファイルをプロジェクトルートに作成し、必要な環境変数を設定してください。

### 3. データベースのセットアップ（Prismaを使用する場合）

```bash
# Prismaクライアントの生成
pnpm prisma generate

# マイグレーションの実行（開発環境）
pnpm prisma migrate dev
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

アプリケーションが http://localhost:8787 で起動します。

## 開発

### ローカル開発

```bash
pnpm dev
```

### タイプチェック

```bash
pnpm typecheck
```

### フォーマット

```bash
pnpm format
```

### リント

```bash
pnpm lint
```

## デプロイ

### シークレット環境変数の設定

```bash
# 本番環境のシークレットを設定
pnpm wrangler secret put POSTGRES_PRISMA_URL
pnpm wrangler secret put POSTGRES_URL_NON_POOLING
pnpm wrangler secret put RESEND_API_KEY
```

### 本番環境へのデプロイ

```bash
pnpm deploy:production
```

### ステージング環境へのデプロイ

```bash
pnpm deploy:staging
```

## APIエンドポイント

### ヘルスチェック

```
GET /health
```

### 管理者招待

```
POST /api/admin-invitations
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

## アーキテクチャの特徴

- **クリーンアーキテクチャ**: ドメイン層、アプリケーション層、アダプター層を明確に分離
- **依存性逆転の原則**: インターフェース（ポート）を通じた依存性の管理
- **環境変数の型安全性**: Zodによる環境変数の検証とTypeScriptの型付け
- **ステートレス設計**: Cloudflare Workersに最適化されたリクエスト毎のインスタンス生成
- **モック実装**: 開発・テスト環境用のモックサービス

## ライセンス

MIT
