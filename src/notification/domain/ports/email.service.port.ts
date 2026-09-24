export const EMAIL_SERVICE = 'EMAIL_SERVICE';

export interface SendEmailPayload {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  text?: string;
  html?: string;
}

export interface EmailService {
  sendEmail(payload: SendEmailPayload): Promise<void>;
}