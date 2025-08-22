import { SendEmailPort, EmailMessage, EmailResult } from '../../../application/port/out/send-email-port';
import { DomainError, ErrorType } from '../../../common/errors/domain-error';
import { Resend } from 'resend';

export interface EmailServiceConfig {
  apiKey: string;
  fromAddress: string;
  defaultReplyTo?: string;
  isProduction: boolean;
}

/**
 * Resend APIを使用したメール送信サービス
 * 開発環境ではテスト用アドレスに送信
 */
export class ResendEmailService implements SendEmailPort {
  private readonly resendClient: Resend;
  private readonly config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;

    // API キーの検証
    if (!config.apiKey) {
      throw new DomainError(ErrorType.CONFIGURATION_ERROR, 'Resend API キーが設定されていません');
    }

    // Resend クライアントの初期化
    this.resendClient = new Resend(config.apiKey);
  }

  /**
   * メールを送信
   * 開発環境では delivered@resend.dev に送信される
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      // 送信先の決定（開発環境ではテスト用アドレス）
      const to = this.config.isProduction ? [message.to] : ['delivered@resend.dev'];

      // 開発環境では元の宛先をログに記録
      if (!this.config.isProduction) {
        console.log(`[開発環境] 本来の送信先: ${message.to}`);
        console.log(`[開発環境] テスト送信先: delivered@resend.dev`);
      }

      // Resend APIを使用してメール送信
      const result = await this.resendClient.emails.send({
        from: this.config.fromAddress,
        to: to,
        subject: message.subject,
        html: message.html,
        replyTo: message.replyTo || this.config.defaultReplyTo,
      });

      // エラーチェック
      if (result.error) {
        console.error('Resend API エラー:', result.error);
        return {
          id: '',
          success: false,
          error: `メール送信に失敗しました: ${result.error.message}`,
        };
      }

      // データが存在しない場合のエラーハンドリング
      if (!result.data || !result.data.id) {
        console.error('Resend API レスポンスエラー: データが不正です', result);
        return {
          id: '',
          success: false,
          error: 'メール送信のレスポンスが不正です',
        };
      }

      console.log(`メール送信成功: ID=${result.data.id}`);

      return {
        id: result.data.id,
        success: true,
      };
    } catch (error) {
      // エラーログ
      console.error('メール送信エラー:', error);

      // エラーメッセージの構築
      let errorMessage = 'メール送信中に予期しないエラーが発生しました';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Resend特有のエラーメッセージの処理
        if (error.message.includes('rate_limit_exceeded')) {
          errorMessage = 'メール送信のレート制限に達しました。しばらく待ってから再試行してください。';
        } else if (error.message.includes('invalid_api_key')) {
          errorMessage = 'メールサービスの設定エラーです。管理者にお問い合わせください。';
        } else if (error.message.includes('validation_error')) {
          errorMessage = 'メールアドレスまたはメール内容が不正です。';
        }
      }

      return {
        id: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * テスト用：設定を確認
   */
  validateConfiguration(): boolean {
    try {
      if (!this.config.apiKey || !this.config.apiKey.startsWith('re_')) {
        console.error('Resend API キーが無効です');
        return false;
      }

      if (!this.config.fromAddress || !this.config.fromAddress.includes('@')) {
        console.error('送信元メールアドレスが無効です');
        return false;
      }

      return true;
    } catch (error) {
      console.error('設定検証エラー:', error);
      return false;
    }
  }

  /**
   * 開発環境向け：テストメール送信
   */
  async sendTestEmail(): Promise<EmailResult> {
    return this.send({
      to: 'test@example.com',
      subject: '[テスト] Resend Email Service 動作確認',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>テストメール</h2>
          <p>このメールは Resend Email Service の動作確認用です。</p>
          <p>送信時刻: ${new Date().toLocaleString('ja-JP')}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            環境: ${this.config.isProduction ? '本番環境' : '開発環境'}
          </p>
        </div>
      `,
      replyTo: this.config.defaultReplyTo,
    });
  }
}
