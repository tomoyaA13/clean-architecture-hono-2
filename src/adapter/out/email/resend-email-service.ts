import { SendEmailPort, EmailMessage, EmailResult } from '../../../application/port/out/send-email-port';

export interface EmailServiceConfig {
  apiKey: string;
  fromAddress: string;
  defaultReplyTo?: string;
}

export class EmailService implements SendEmailPort {
  constructor(private readonly config: EmailServiceConfig) {}

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      // Resend APIを使用してメールを送信
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.fromAddress,
          to: message.to,
          subject: message.subject,
          html: message.html,
          reply_to: message.replyTo || this.config.defaultReplyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          id: '',
          success: false,
          error: `Resend API error: ${error}`,
        };
      }

      const data = await response.json();
      return {
        id: data.id,
        success: true,
      };
    } catch (error) {
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
