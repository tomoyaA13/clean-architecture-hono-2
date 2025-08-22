import { SendEmailPort } from '../../../application/port/out/send-email-port';
import { EmailService, EmailServiceConfig } from './resend-email-service';
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
      console.log('📧 Using Mock Email Service');
      return new MockEmailService();
    } else {
      console.log('📧 Using Resend Email Service');

      const emailServiceConfig: EmailServiceConfig = {
        apiKey: config.email.apiKey || '',
        fromAddress: config.email.fromAddress,
        defaultReplyTo: config.email.defaultReplyTo,
      };

      return new EmailService(emailServiceConfig);
    }
  }
}
