import { EmailMessage, EmailResult } from '../application/port/out/send-email-port';

export interface EmailServiceInterface {
  send(message: EmailMessage): Promise<EmailResult>;
}

export function createEmailService(config: { apiKey?: string; fromAddress: string; useMock: boolean }): EmailServiceInterface {
  if (config.useMock) {
    return {
      async send(message: EmailMessage): Promise<EmailResult> {
        console.log('Mock email sent to:', message.to);
        return { id: 'mock-id', success: true };
      },
    };
  }

  return {
    async send(message: EmailMessage): Promise<EmailResult> {
      // 実際のメール送信実装
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.fromAddress,
          to: message.to,
          subject: message.subject,
          html: message.html,
        }),
      });

      if (!response.ok) {
        return { id: '', success: false, error: 'Failed to send email' };
      }

      const data = await response.json();
      // TODO この TS error を修正する
      return { id: data.id, success: true };
    },
  };
}
