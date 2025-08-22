# Email Service 実装ガイド

## 概要

このプロジェクトでは、メール送信に [Resend](https://resend.com) を使用しています。
開発環境では自動的にテスト用アドレスに送信されるため、実際のメールアドレスにメールが送信される心配はありません。

## アーキテクチャ

```
SendEmailPort (インターフェース)
    ├── ResendEmailService (本番用)
    └── MockEmailService (テスト用)
```

## 主な機能

### ResendEmailService

1. **環境別の送信先制御**
   - 本番環境: 実際の宛先に送信
   - 開発環境: `delivered@resend.dev` に送信（テスト用）

2. **エラーハンドリング**
   - レート制限エラー
   - API キーエラー
   - バリデーションエラー

3. **設定検証**
   - API キーの形式チェック
   - メールアドレスの形式チェック

### MockEmailService

1. **送信シミュレーション**
   - コンソールにメール内容を出力
   - 送信履歴の管理

2. **テスト支援機能**
   - エラーシミュレーション
   - 送信統計の表示
   - 履歴の検索・クリア

## 設定

### 環境変数 (.dev.vars)

```bash
# Resend API キー
RESEND_API_KEY=re_xxxxxxxxxxxxx

# メール設定
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_REPLY_TO=support@example.com
USE_MOCK_EMAIL=false  # true にするとモックサービスを使用

# フロントエンド URL
FRONTEND_URL=http://localhost:3000
```

### Resend API キーの取得

1. [Resend](https://resend.com) にサインアップ
2. Dashboard → API Keys → Create API Key
3. API キーをコピーして `.dev.vars` に設定

## 使用方法

### 基本的な使用

```typescript
// サービスファクトリーから取得
const emailService = EmailServiceFactory.createEmailService(envConfig);

// メール送信
const result = await emailService.send({
  to: 'user@example.com',
  subject: '確認メール',
  html: '<h1>こんにちは</h1><p>これはテストメールです。</p>',
  replyTo: 'support@example.com'
});

if (result.success) {
  console.log(`メール送信成功: ID=${result.id}`);
} else {
  console.error(`メール送信失敗: ${result.error}`);
}
```

### テストメールの送信

```typescript
// ResendEmailService のインスタンスを直接作成
const emailService = new ResendEmailService({
  apiKey: 'your-api-key',
  fromAddress: 'test@example.com',
  defaultReplyTo: 'reply@example.com',
  isProduction: false
});

// テストメール送信
const result = await emailService.sendTestEmail();
```

### モックサービスの使用（テスト用）

```typescript
const mockService = new MockEmailService();

// メール送信
await mockService.send({
  to: 'test@example.com',
  subject: 'テスト',
  html: '<p>テストメール</p>'
});

// 送信履歴の確認
const sentEmails = mockService.getSentEmails();
console.log(`送信数: ${sentEmails.length}`);

// 統計表示
mockService.printStatistics();

// エラーシミュレーション
mockService.simulateFailure();
const result = await mockService.send(...); // これは失敗する
```

## 開発環境での動作

開発環境（`NODE_ENV !== 'production'`）では：

1. **実際のメールアドレスには送信されません**
   - すべて `delivered@resend.dev` に送信される
   - Resend のダッシュボードで確認可能

2. **ログ出力**
   - 本来の送信先がコンソールに表示される
   - メールサービスの設定情報が表示される

## トラブルシューティング

### よくあるエラー

#### 1. API キーエラー
```
メールサービスの設定エラーです。管理者にお問い合わせください。
```
**解決方法**: `.dev.vars` の `RESEND_API_KEY` を確認

#### 2. レート制限エラー
```
メール送信のレート制限に達しました。しばらく待ってから再試行してください。
```
**解決方法**: しばらく待つか、Resend プランをアップグレード

#### 3. バリデーションエラー
```
メールアドレスまたはメール内容が不正です。
```
**解決方法**: メールアドレスの形式を確認

### デバッグ方法

1. **環境変数の確認**
   ```bash
   cat .dev.vars | grep -E "RESEND|EMAIL"
   ```

2. **モックサービスに切り替え**
   ```bash
   # .dev.vars
   USE_MOCK_EMAIL=true
   ```

3. **Resend ダッシュボードで確認**
   - https://resend.com/emails でメール送信履歴を確認

## ベストプラクティス

1. **開発時はモックサービスを使用**
   - API 使用量を節約
   - 高速なテスト実行

2. **本番環境への移行前にステージング環境でテスト**
   - `delivered@resend.dev` での動作確認
   - エラーハンドリングの確認

3. **適切なエラーハンドリング**
   - ユーザーに分かりやすいエラーメッセージ
   - 詳細なログ記録

4. **レート制限への対応**
   - リトライロジックの実装
   - 送信間隔の調整

## 参考リンク

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://github.com/resendlabs/resend-node)
- [Resend API Reference](https://resend.com/docs/api-reference)
