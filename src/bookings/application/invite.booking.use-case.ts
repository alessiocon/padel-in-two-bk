import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { BOOKING_IREPOSITORY, type IBookingRepository } from '../infrastructure/booking-IRepository.js';
import { BookingLogs } from '../domain/valueObject/booking.log.value.js';
import { BookingResDto } from '../presentation/booking.dto.js';
import { BookingMapper } from '../infrastructure/prisma-booking-mapper.js';

export type InviteBookingInput = {
  bookingId: string;
  teamId: string;
  inviterId: string;
  inviterUsername: string;
  userId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

@Injectable()
export class InviteBookingUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(BOOKING_IREPOSITORY) private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(input: InviteBookingInput): Promise<BookingResDto> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundException('Prenotazione non trovata.');
    }

    const now = this.clock.now();
    const playerInput = input.userId
      ? { type: 'REGISTERED' as const, userId: input.userId }
      : {
          type: 'GUEST' as const,
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          phone: input.phone,
        };
    const updatedBooking = booking.addPlayerToTeam(input.teamId, playerInput, now);
    const targetName = input.userId
      ? input.username?.trim() || input.userId
      : `${input.firstName!.trim()} ${input.lastName!.trim()}`;
    const auditLog = BookingLogs.playerAdded({
      bookingId: booking.id,
      userId: input.inviterId,
      actorUsername: input.inviterUsername,
      targetName,
      isRegistered: Boolean(input.userId),
      createdAt: now,
    });

    const bookingWithLog = updatedBooking.addLogs([auditLog], now);
    const savedBooking = await this.bookingRepository.update(bookingWithLog);

    return BookingMapper.domainBookingToDto(savedBooking);
  }
}