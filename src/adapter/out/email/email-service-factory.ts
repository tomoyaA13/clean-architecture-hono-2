import { SendEmailPort } from '../../../application/port/out/send-email-port';
import { ResendEmailService, EmailServiceConfig } from './resend-email-service';
import { MockEmailService } from './mock-email-service';
import { EnvConfig } from '../../../common/env-config';

export class EmailServiceFactory {
  /**
   * 環境設定に基づいてメールサービスを作成
   * @param envConfig 環境設定オブジェクト
   */
  static createEmailService(envConfig: EnvConfig): SendEmailPort {
    const config = envConfig.config;

    // モックを使用するかどうかを判断
    if (config.email.useMock) {
      console.log('📧 モックメールサービスを使用');
      return new MockEmailService();
    } else {
      console.log('📧 Resend メールサービスを使用');

      if (!config.email.apiKey) {
        console.warn('⚠️ Resend API キーが設定されていません。モックサービスにフォールバックします。');
        return new MockEmailService();
      }

      const emailServiceConfig: EmailServiceConfig = {
        apiKey: config.email.apiKey,
        fromAddress: config.email.fromAddress,
        defaultReplyTo: config.email.defaultReplyTo,
        isProduction: config.env.isProduction,
      };

      // Resend サービスのインスタンスを作成
      const emailService = new ResendEmailService(emailServiceConfig);

      // 設定の検証
      if (!emailService.validateConfiguration()) {
        console.error('❌ メールサービスの設定が無効です。モックサービスにフォールバックします。');
        return new MockEmailService();
      }

      // 開発環境では設定情報をログ出力（APIキーは除く）
      if (!config.env.isProduction) {
        console.log('📧 メールサービス設定:');
        console.log(`  - 送信元: ${emailServiceConfig.fromAddress}`);
        console.log(`  - 返信先: ${emailServiceConfig.defaultReplyTo || '(未設定)'}`);
        console.log(`  - 環境: ${emailServiceConfig.isProduction ? '本番' : '開発（テストアドレスに送信）'}`);
      }

      return emailService;
    }
  }

  /**
   * テスト用：強制的にモックサービスを作成
   */
  static createMockService(): SendEmailPort {
    return new MockEmailService();
  }

  /**
   * テスト用：強制的に Resend サービスを作成
   */
  static createResendService(config: EmailServiceConfig): SendEmailPort {
    return new ResendEmailService(config);
  }
}
