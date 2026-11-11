import { Inject, Injectable } from '@nestjs/common';
import { Booking, BookingStatus } from '../domain/booking.aggregate.js';
import { AwardBookingPromotionsService } from '../../promotions/application/award-booking-promotions.service.js';
import { BOOKING_MATCH_UNIT_OF_WORK, type IBookingMatchUnitOfWork } from './booking-match.unit-of-work.js';
import type { BookingMatchResDto } from '../presentation/booking.dto.js';

@Injectable()
export class SaveBookingMatchService {
  constructor(
    @Inject(BOOKING_MATCH_UNIT_OF_WORK) private readonly unitOfWork: IBookingMatchUnitOfWork,
    private readonly promotions: AwardBookingPromotionsService,
  ) {}

  execute(previous: Booking, updated: Booking): Promise<BookingMatchResDto> {
    return this.unitOfWork.execute(async transaction => {
      const result = await transaction.saveMatch(updated, previous.updatedAt);
      if (previous.status !== BookingStatus.END && updated.status === BookingStatus.END) {
        await this.promotions.execute({
          bookingId: updated.id,
          userId: updated.createdById,
          promotions: updated.promotionsToAward(),
          completedAt: updated.updatedAt,
        }, transaction.promotionAwards);
      }
      return result;
    });
  }
}