import type { Booking } from '../domain/booking.aggregate.js';
import type { BookingMatchResDto } from '../presentation/booking.dto.js';
import type { IPromotionAwardRepository } from '../../promotions/domain/promotion-award.repository.js';

export type BookingMatchTransaction = {
  saveMatch(booking: Booking, expectedUpdatedAt: Date): Promise<BookingMatchResDto>;
  promotionAwards: IPromotionAwardRepository;
};

export const BOOKING_MATCH_UNIT_OF_WORK = Symbol('BOOKING_MATCH_UNIT_OF_WORK');

export interface IBookingMatchUnitOfWork {
  execute<Result>(work: (transaction: BookingMatchTransaction) => Promise<Result>): Promise<Result>;
}