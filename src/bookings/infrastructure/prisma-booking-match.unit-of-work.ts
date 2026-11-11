import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { PrismaPromotionRepository } from '../../promotions/infrastructure/prisma-promotion.repository.js';
import type { BookingMatchTransaction, IBookingMatchUnitOfWork } from '../application/booking-match.unit-of-work.js';
import { PrismaBookingRepository } from './prisma-booking-repository.js';

@Injectable()
export class PrismaBookingMatchUnitOfWork implements IBookingMatchUnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: PrismaBookingRepository,
    private readonly promotions: PrismaPromotionRepository,
  ) {}

  execute<Result>(work: (transaction: BookingMatchTransaction) => Promise<Result>): Promise<Result> {
    return this.prisma.$transaction(transaction => work({
      saveMatch: (booking, expectedUpdatedAt) => this.bookings.saveMatch(booking, expectedUpdatedAt, transaction),
      promotionAwards: this.promotions.forAwards(transaction),
    }));
  }
}