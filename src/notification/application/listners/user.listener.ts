import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SERVICE, type EmailService } from '../../domain/ports/email.service.port.js';
import { loadAppSettings } from '../../../config/appsettings.js';
import { userForgotPasswordEvent, userRegisteredEvent } from '../../../user/domain/user-events.js';



@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);
  private readonly config = loadAppSettings()
  constructor(
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
  ) {}

  @OnEvent('user.registered', { async: true })
  async handleUserRegisteredEvent(event: userRegisteredEvent): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: event.email,
        subject: 'Conferma Email per PadelInTwo',
        text: `Ciao ${event.firstName}, grazie per esserti registrato.`,
        html: `<h1>Benvenuto ${event.firstName}!</h1>
          <p>Grazie per esserti registrato sulla nostra piattaforma.</p>
          <p>manca un ultimo step per abilitare il tuo account, clicca il link per confermare l'email</p>
          <a href="${this.config.client.host}/auth/emailconfirmation?tokenId=${event.verificationToken}">Conferma email</a>`,
      });
    } catch (error) {
      // this.logger.error(
      //   `Fallimento nell'invio dell'email di benvenuto per l'utente ID: ${event.userId}`,
      //   error,
      // );
    }
  }


  @OnEvent('user.forgotPassword', { async: true })
  async handleUserForgotPassword(event: userForgotPasswordEvent): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: event.email,
        subject: 'Recupero password',
        text: `Per recuperare la tua password, compila il form a questo link entro 15 minuti`,
        html: `<h1>Recupero Password</h1>
          <p>Abbiamo ricevuto una richiesta per il recupero della password</p>
          <p>per continuare, clicca il link e compila il form entro 15 minuti</p>
          <a href="${this.config.client.host}/auth/resetpassword?tokenId=${event.token}">Cambia password</a>`,
      });
    } catch (error) {
      // this.logger.error(
      //   `Fallimento nell'invio dell'email di benvenuto per l'utente ID: ${event.userId}`,
      //   error,
      // );
    }
  }
}