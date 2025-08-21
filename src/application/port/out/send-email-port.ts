export interface SendEmailOptions {
  email: string;
  subject: string;
  initialSentence: string;
  secondSentenceEnding: string;
  constructedLink: string;
}

export interface SendEmailResult {
  status: 'success' | 'error';
  message?: string;
}

export interface SendEmailPort {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
