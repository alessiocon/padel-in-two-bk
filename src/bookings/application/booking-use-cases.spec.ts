import { describe, expect, it } from 'vitest';
import { CreateBookingUseCase, GetBookingUseCase } from './booking-use-cases.js';
import { Booking } from '../domain/booking.js';
import type { IBookingRepository } from '../domain/booking-repository.js';

describe('booking use cases', () => {
  const repository: IBookingRepository = {
    create: async (booking) => booking,
    findById: async () => null,
    findAllByClubId: async () => [],
  };

  it('creates a booking without a customer dependency', async () => {
    const useCase = new CreateBookingUseCase(repository);
    const result = await useCase.execute({
      clubId: 'club-1',
      courtId: 'court-1',
      startsAt: new Date('2026-09-02T10:00:00.000Z'),
    });

    expect(result).toBeInstanceOf(Booking);
    expect(result.clubId).toBe('club-1');
  });

  it('does not return a booking from another club', async () => {
    const useCase = new GetBookingUseCase(repository);

    await expect(useCase.execute('booking-1', 'club-1')).rejects.toThrow('Booking not found');
  });
});
