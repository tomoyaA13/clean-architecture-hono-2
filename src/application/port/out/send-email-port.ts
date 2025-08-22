export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface SendEmailPort {
  send(message: EmailMessage): Promise<EmailResult>;
}
