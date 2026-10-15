import { describe, expect, it } from 'vitest';
import { Booking, BookingStatus } from './booking.aggregate.js';
import { BookingPlayer, BookingPlayerStatus } from './entity/booking.player.entity.js';
import { BookingTeam } from './entity/booking.team.entity.js';

describe('Booking.isAcceptedBookingByUser', () => {
  const createBooking = () => {
    const now = new Date('2026-10-13T10:00:00.000Z');
    const team = BookingTeam.create({
      bookingId: 'booking-1',
      teamNumber: 1,
      teamName: 'Team 1',
    }, 'team-1').addPlayer(BookingPlayer.create({
      teamId: 'team-1',
      status: BookingPlayerStatus.PENDING,
      identity: { type: 'REGISTERED', userId: 'player-1' },
    }, 'player-1'));

    return Booking.create({
      clubId: 'club-1',
      courtId: 'court-1',
      createdById: 'creator-1',
      startsAt: new Date('2026-10-14T10:00:00.000Z'),
      endsAt: new Date('2026-10-14T11:00:00.000Z'),
      status: BookingStatus.PENDING,
      teams: [team],
      logs: [],
      createdAt: now,
    }, 'booking-1');
  };

  it('updates the matching player status when accepted', () => {
    const booking = createBooking();

    const updated = booking.isAcceptedBookingByUser('player-1', true, new Date());

    expect(updated.teams[0].players[0].status).toBe(BookingPlayerStatus.ACCEPTED);
    expect(booking.teams[0].players[0].status).toBe(BookingPlayerStatus.PENDING);
  });

  it('removes the player from the team when they decline', () => {
    const booking = createBooking();

    const updated = booking.isAcceptedBookingByUser('player-1', false, new Date());

    expect(updated.teams[0].players).toHaveLength(0);
    expect(booking.teams[0].players).toHaveLength(1);
  });

  it('does not allow the booking creator to respond', () => {
    const booking = createBooking();

    expect(() => booking.isAcceptedBookingByUser('creator-1', true, new Date()))
      .toThrow('Il creatore della prenotazione non può accettare o rifiutare la propria prenotazione.');
  });

  it('requires the user to belong to a team', () => {
    const booking = createBooking();

    expect(() => booking.isAcceptedBookingByUser('other-user', true, new Date()))
      .toThrow("L'utente non fa parte della prenotazione.");
  });
});