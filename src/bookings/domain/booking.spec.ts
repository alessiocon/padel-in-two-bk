import { describe, expect, it } from 'vitest';
import { BOOKING_DURATION_MINUTES, Booking } from './booking.js';

describe('Booking', () => {
  const input = {
    clubId: 'club-1',
    courtId: 'court-1',
    startsAt: new Date('2026-09-02T10:00:00.000Z'),
  };

  it('derives the fixed duration and defaults to reserved', () => {
    const booking = Booking.create(input);

    expect(booking.status).toBe('reserved');
    expect(booking.endsAt.getTime() - booking.startsAt.getTime()).toBe(BOOKING_DURATION_MINUTES * 60_000);
  });

  it('supports exactly the four booking states', () => {
    expect(['free', 'reserved', 'searching', 'blocked'].map((status) => Booking.create({ ...input, status }).status))
      .toEqual(['free', 'reserved', 'searching', 'blocked']);
  });

  it('detects active overlap but allows adjacent or free intervals', () => {
    const booking = Booking.create(input);
    const overlapping = Booking.create({ ...input, startsAt: new Date('2026-09-02T10:30:00.000Z') });
    const adjacent = Booking.create({ ...input, startsAt: new Date('2026-09-02T11:00:00.000Z') });
    const free = Booking.create({ ...input, status: 'free' });

    expect(booking.overlaps(overlapping)).toBe(true);
    expect(booking.overlaps(adjacent)).toBe(false);
    expect(booking.overlaps(free)).toBe(false);
  });

  it('rejects invalid dates and non-fixed intervals', () => {
    expect(() => Booking.create({ ...input, startsAt: new Date('invalid') })).toThrow(/valid/);
    expect(() => Booking.reconstitute({
      ...Booking.create(input).toPrimitives(),
      endsAt: new Date('2026-09-02T12:00:00.000Z'),
    })).toThrow(/exactly 60 minutes/);
  });
});
