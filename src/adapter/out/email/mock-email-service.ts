import { SendEmailPort, EmailMessage, EmailResult } from '../../../application/port/out/send-email-port';

export class MockEmailService implements SendEmailPort {
  private sentEmails: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailResult> {
    console.log('📧 Mock Email Service - Sending email:');
    console.log('To:', message.to);
    console.log('Subject:', message.subject);
    console.log('---');

    this.sentEmails.push(message);

    return {
      id: `mock_${Date.now()}`,
      success: true,
    };
  }

  getSentEmails(): EmailMessage[] {
    return this.sentEmails;
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }
}
