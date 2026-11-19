import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BookingCreatedEvent,
  BookingEvent,
  BookingMatchProposedEvent,
  BookingMatchRespondedEvent,
  BookingPlayerInvitedEvent,
  BookingPlayerRemovedEvent,
  BookingPlayerRespondedEvent,
  BookingStaffRespondedEvent,
} from '../../../bookings/domain/booking-events.js';
import { loadAppSettings } from '../../../config/appsettings.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { EMAIL_SERVICE, type EmailService } from '../../domain/ports/email.service.port.js';

type RecipientScope = 'created' | 'creator' | 'invited' | 'participants' | 'players' | 'removed';

@Injectable()
export class BookingListener {
  private readonly logger = new Logger(BookingListener.name);
  private readonly config = loadAppSettings();

  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('booking.created', { async: true })
  async handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
    await this.notify(event, 'Nuova prenotazione', `${event.actorUsername} ha creato una prenotazione.`, 'created');
  }

  @OnEvent('booking.player.invited', { async: true })
  async handlePlayerInvited(event: BookingPlayerInvitedEvent): Promise<void> {
    await this.notify(event, 'Invito ad una partita', `${event.actorUsername} ti ha invitato ad una partita.`, 'invited', event.playerId);
  }

  @OnEvent('booking.staff.responded', { async: true })
  async handleStaffResponded(event: BookingStaffRespondedEvent): Promise<void> {
    const outcome = event.isAccepted ? 'accettato' : 'rifiutato';
    const reason = event.reason ? ` Motivo: ${event.reason}` : '';
    await this.notify(event, `Prenotazione ${event.isAccepted ? 'accettata' : 'rifiutata'}`, `Lo staff ha ${outcome} la prenotazione.${reason}`);
  }

  @OnEvent('booking.player.responded', { async: true })
  async handlePlayerResponded(event: BookingPlayerRespondedEvent): Promise<void> {
    await this.notify(event, 'Risposta a un invito', `${event.actorUsername} ha ${event.isAccepted ? 'accettato' : 'rifiutato'} l'invito alla partita.`, 'creator');
  }

  @OnEvent('booking.match.proposed', { async: true })
  async handleMatchProposed(event: BookingMatchProposedEvent): Promise<void> {
    await this.notify(event, 'Nuova proposta di risultato', `${event.actorUsername} ha proposto un risultato per la partita.`, 'players');
  }

  @OnEvent('booking.match.responded', { async: true })
  async handleMatchResponded(event: BookingMatchRespondedEvent): Promise<void> {
    await this.notify(event, 'Risposta alla proposta di risultato', `${event.actorUsername} ha ${event.isAccepted ? 'accettato' : 'rifiutato'} la proposta di risultato.`, 'players');
  }

  @OnEvent('booking.player.removed', { async: true })
  async handlePlayerRemoved(event: BookingPlayerRemovedEvent): Promise<void> {
    await this.notify(event, 'Partecipante rimosso', `${event.actorUsername} ha rimosso un partecipante dalla prenotazione.`, 'removed', event.playerId);
  }

  private async notify(
    event: BookingEvent,
    subject: string,
    message: string,
    scope: RecipientScope = 'participants',
    targetPlayerId?: string,
  ): Promise<void> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: event.bookingId },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          createdBy: { select: { id: true, email: true } },
          club: {
            select: {
              name: true,
              email: true,
              timezone: true,
              members: { select: { user: { select: { id: true, email: true } } } },
            },
          },
          court: { select: { name: true } },
          teams: {
            select: {
              players: {
                where: { status: { in: ['PENDING', 'ACCEPTED'] } },
                select: { player: { select: { user: { select: { id: true, email: true } } } } },
              },
            },
          },
        },
      });
      if (!booking) return;

      const recipients = scope === 'invited' || scope === 'players'
        ? []
        : scope === 'creator'
          ? [booking.createdBy]
          : [booking.createdBy, ...booking.club.members.map(member => member.user)];

      if (scope === 'participants' || scope === 'players' || scope === 'removed') {
        for (const team of booking.teams) {
          for (const participant of team.players) {
            if (participant.player) recipients.push(participant.player.user);
          }
        }
      }

      if (targetPlayerId) {
        const target = await this.prisma.player.findUnique({
          where: { id: targetPlayerId },
          select: { user: { select: { id: true, email: true } } },
        });
        if (target) recipients.push(target.user);
      }

      const emails = new Set(recipients
        .filter(recipient => recipient.id !== event.actorId)
        .map(recipient => recipient.email.toLowerCase()));
      if (scope === 'created') emails.add(booking.club.email.toLowerCase());
      const dateFormat = new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'short',
        timeZone: booking.club.timezone,
      });
      const timeFormat = new Intl.DateTimeFormat('it-IT', {
        timeStyle: 'short',
        timeZone: booking.club.timezone,
      });
      const details = `${booking.club.name} - ${booking.court.name}\n${dateFormat.format(booking.startsAt)}\nDalle ${timeFormat.format(booking.startsAt)} alle ${timeFormat.format(booking.endsAt)}`;
      const text = `${message}\n\n${details}\n\n${this.config.client.host}`;
      const html = `<h1>${this.escapeHtml(subject)}</h1><p>${this.escapeHtml(message)}</p><p>${this.escapeHtml(details).replaceAll('\n', '<br>')}</p><a href="${this.escapeHtml(this.config.client.host)}">Apri PadelInTwo</a>`;

      await Promise.all([...emails].map(async to => {
        try {
          await this.emailService.sendEmail({ to, subject, text, html });
        } catch (error) {
          this.logger.error(`Invio notifica fallito per la prenotazione ${event.bookingId}`, error);
        }
      }));
    } catch (error) {
      this.logger.error(`Gestione notifica fallita per la prenotazione ${event.bookingId}`, error);
    }
  }

  private escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}