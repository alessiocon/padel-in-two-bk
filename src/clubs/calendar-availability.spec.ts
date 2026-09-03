import { describe, expect, it } from 'vitest';
import { calculateCalendarAvailability } from './calendar-availability.js';

describe('calculateCalendarAvailability', () => {
  it('returns only available courts and marks a partially available slot bookable', () => {
    const result = calculateCalendarAvailability('club-1', [
      { id: 'court-1', clubId: 'club-1', status: 'available' },
      { id: 'court-2', clubId: 'club-1', status: 'maintenance' },
      { id: 'court-3', clubId: 'club-1', status: 'inactive' },
      { id: 'court-4', clubId: 'club-2', status: 'available' },
    ]);

    expect(result).toEqual({
      isBookable: true,
      availableCourtCount: 1,
      availableCourtIds: ['court-1'],
      status: 'partially_available',
    });
  });

  it('closes a slot and exposes no courts when none are available', () => {
    const result = calculateCalendarAvailability('club-1', [
      { id: 'court-1', clubId: 'club-1', status: 'reserved' },
      { id: 'court-2', clubId: 'club-1', status: 'maintenance' },
    ]);

    expect(result).toEqual({
      isBookable: false,
      availableCourtCount: 0,
      availableCourtIds: [],
      status: 'closed',
    });
  });

  it('excludes courts with overlapping active bookings but allows adjacent intervals', () => {
    const result = calculateCalendarAvailability(
      'club-1',
      [
        { id: 'court-1', clubId: 'club-1', status: 'available' },
        { id: 'court-2', clubId: 'club-1', status: 'available' },
      ],
      [
        {
          courtId: 'court-1',
          startsAt: new Date('2026-09-02T10:00:00.000Z'),
          endsAt: new Date('2026-09-02T11:00:00.000Z'),
          status: 'reserved',
        },
      ],
      {
        startsAt: new Date('2026-09-02T11:00:00.000Z'),
        endsAt: new Date('2026-09-02T12:00:00.000Z'),
      },
    );

    expect(result.availableCourtIds).toEqual(['court-1', 'court-2']);
  });
});