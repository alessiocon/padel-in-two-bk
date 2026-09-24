import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailService, SendEmailPayload } from './../../domain/ports/email.service.port.js';
import { type AppEnv, ENV_CONFIG } from '../../../config/env.js';

@Injectable()
export class NodemailerAdapter implements EmailService {
  private readonly logger = new Logger(NodemailerAdapter.name);
  private transporter: nodemailer.Transporter;


  constructor(@Inject(ENV_CONFIG) private readonly env: AppEnv){
    this.transporter = nodemailer.createTransport({
      host: this.env.smtp_server || 'smtp.example.com',
      port: Number(this.env.smtp_port) || 587,
      secure: this.env.smtp_secure ?? false,
      auth: {
        user: this.env.smtp_user,
        pass: this.env.smtp_pass,
      },
    });
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `\"Padel Platform\" <${this.env.smtp_from}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html || this.buildFallbackHtml(payload),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email inviata con successo a ${payload.to}`);
    } catch (error) {
      this.logger.error(`Errore nell'invio dell'email a ${payload.to}`, error);
      throw error;
    }
  }

  private buildFallbackHtml(payload: SendEmailPayload): string {
    if (payload.context && Object.keys(payload.context).length > 0) {
      return `<p>${payload.text || 'Notifica'}</p><pre>${JSON.stringify(payload.context, null, 2)}</pre>`;
    }
    return `<p>${payload.text || ''}</p>`;
  }
}