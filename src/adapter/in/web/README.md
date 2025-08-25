# レイヤー重視のディレクトリ構造

このディレクトリは Clean Architecture のレイヤー構造に従って整理されています。

## 📁 ディレクトリ構造

```
/adapter/in/web/
  ├── routers/            # ルーター層（OpenAPIHonoインスタンスの設定）
  │   └── admin-invitations.router.ts
  ├── routes/             # ルート定義層（OpenAPIスキーマ定義）
  │   └── admin-invitations.routes.ts
  ├── handlers/           # ハンドラー層（リクエスト処理）
  │   └── admin-invitations.handlers.ts
  └── controllers/        # コントローラー層（ビジネスロジックへの橋渡し）
      └── admin-invitation-controller.ts
```

## 🎯 各層の責務

### 1. **Routers層** (`/routers`)
- OpenAPIHonoインスタンスの作成と設定
- ルート定義とハンドラーの結合
- ミドルウェアの適用（必要に応じて）

### 2. **Routes層** (`/routes`)
- OpenAPIスキーマの定義
- リクエスト/レスポンスの型定義
- バリデーションルールの設定
- APIドキュメントの生成元

### 3. **Handlers層** (`/handlers`)
- HTTPリクエストの処理
- コントローラーの呼び出し
- エラーハンドリング
- レスポンスの返却

### 4. **Controllers層** (`/controllers`)
- ビジネスロジックの実行
- ユースケースの呼び出し
- ドメインサービスとの連携
- データの変換

## 🔄 データフロー

```
Client Request
    ↓
[Router] ← OpenAPIHonoインスタンス
    ↓
[Route] ← バリデーション & 型チェック
    ↓
[Handler] ← リクエスト処理
    ↓
[Controller] ← ビジネスロジック
    ↓
[UseCase/Domain] ← アプリケーション層
    ↓
Response
```

## 📝 命名規則

- **Routers**: `{feature}.router.ts`
- **Routes**: `{feature}.routes.ts`
- **Handlers**: `{feature}.handlers.ts`
- **Controllers**: `{feature}-controller.ts`

## ✅ この構造のメリット

1. **責務の明確な分離** - 各層が単一の責任を持つ
2. **テスタビリティ** - 各層を独立してテスト可能
3. **拡張性** - 新機能の追加が容易
4. **保守性** - コードの場所が予測可能
5. **Clean Architecture準拠** - アーキテクチャ原則に従った設計

## 🚨 移行後のクリーンアップ

以下のディレクトリ/ファイルは削除してください：
- `/adapter/in/web/routes/admin-invitations/` ディレクトリ全体

```bash
# 不要なディレクトリの削除
rm -rf src/adapter/in/web/routes/admin-invitations/
```
