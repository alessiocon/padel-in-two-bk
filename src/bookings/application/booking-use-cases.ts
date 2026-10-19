import { CreateBookingUseCase } from './create-booking-use-cases.js';
import { IsAcceptedBookingByUserUseCase } from './isAccepted-booking-by-user-use-cases.js';
import { InviteBookingUseCase } from './invite.booking.use-case.js';
import { RemovePlayerInBookingTeamUseCase } from './remove.player.in.booking-team.use-case.js';
import { SearchBookingsUseCase } from './search.bookings.use-case.js';
import { CancelPrenotationUseCase } from './cancel.prenotation.use-case.js';
import { RestorePrenotationUseCase } from './restore.prenotation.use-case.js';
import { SearchBookingsManagerUseCase } from './search.bookings.manager.use-case.js';
import { GetBookingByIdUseCase } from './get.booking.by-id.use-case.js';
import { AcceptBookingUseCase } from './accept.boocking.use-case.js';

export const BOOKING_USE_CASES = [
    CreateBookingUseCase,
    GetBookingByIdUseCase,
    CancelPrenotationUseCase,
    AcceptBookingUseCase,
    RestorePrenotationUseCase,
    IsAcceptedBookingByUserUseCase,
    InviteBookingUseCase,
    RemovePlayerInBookingTeamUseCase,
    SearchBookingsUseCase,
    SearchBookingsManagerUseCase
  ];
