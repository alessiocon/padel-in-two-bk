import { describe, expect, it, vi } from 'vitest';
import { BookingCreatedEvent, BookingPlayerInvitedEvent, BookingPlayerRespondedEvent } from '../../../bookings/domain/booking-events.js';
import type { PrismaService } from '../../../database/prisma.service.js';
import { BookingListener } from './booking.listener.js';

describe('BookingListener', () => {
  const createListener = () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const booking = {
      id: 'booking-1',
      startsAt: new Date('2026-11-19T10:00:00Z'),
      endsAt: new Date('2026-11-19T11:30:00Z'),
      createdBy: { id: 'actor-1', email: 'CLUB@example.com' },
      club: {
        name: 'Club',
        email: 'Club@example.com',
        timezone: 'Europe/Rome',
        members: [{ user: { id: 'staff-1', email: 'club@example.com' } }],
      },
      court: { name: 'Campo 1' },
      teams: [],
    };
    const prisma = {
      booking: { findUnique: vi.fn().mockResolvedValue(booking) },
      player: { findUnique: vi.fn().mockResolvedValue({ user: { id: 'player-1', email: 'player@example.com' } }) },
    };
    return { listener: new BookingListener({ sendEmail }, prisma as unknown as PrismaService), sendEmail, prisma, booking };
  };

  it('sends the creation notification once to the club email even when the creator is staff', async () => {
    const { listener, sendEmail, prisma } = createListener();

    await listener.handleBookingCreated(new BookingCreatedEvent('booking-1', 'actor-1', 'Staff'));

    expect(prisma.booking.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ club: { select: expect.objectContaining({ email: true }) } }),
    }));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'club@example.com',
      subject: 'Nuova prenotazione',
      text: expect.stringContaining('Staff ha creato una prenotazione.'),
    }));
  });

  it('does not send an invitation to the club email', async () => {
    const { listener, sendEmail } = createListener();

    await listener.handlePlayerInvited(new BookingPlayerInvitedEvent('booking-1', 'actor-1', 'Staff', 'player-1'));

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'player@example.com' }));
  });

  it.each([
    [true, 'accettato'],
    [false, 'rifiutato'],
  ])('sends an invitation response only to the booking creator (accepted: %s)', async (isAccepted, outcome) => {
    const { listener, sendEmail, booking } = createListener();
    booking.createdBy = { id: 'creator-1', email: 'creator@example.com' };

    await listener.handlePlayerResponded(new BookingPlayerRespondedEvent('booking-1', 'player-1', 'Giocatore', isAccepted));

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'creator@example.com',
      subject: 'Risposta a un invito',
      text: expect.stringContaining(`Giocatore ha ${outcome} l'invito alla prenotazione.`),
    }));
  });
});