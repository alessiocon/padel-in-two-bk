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
import { MatchAddProposeUseCase } from './match.add.propose.use-case.js';
import { MatchAcceptProposeUseCase } from './match.accept.propose.use-case.js';
import { MatchRemoveProposeUseCase } from './match.remove.propose.use-case.js';
import { GetMatchByBookingId } from './get.match.by.bookingid.use-case.js';
import { StartBookingUseCase } from './start.boocking.use-case.js';
import { GetCalendarBookingsUseCase } from './get.calendar.bookings.use-case.js';
import { ReviewPublicJoinRequestUseCase } from './review.public.join.request.use-case.js';
import { WithdrawPublicJoinRequestUseCase } from './withdraw.public.join.request.use-case.js';
import { SearchPublicBookingsUseCase } from './search.public.bookings.use-case.js';
import { JoinPublicBookingUseCase } from './join.public.booking.use-case.js';

export const BOOKING_USE_CASES = [
    CreateBookingUseCase,
    GetBookingByIdUseCase,
    CancelPrenotationUseCase,
    AcceptBookingUseCase,
    StartBookingUseCase,
    RestorePrenotationUseCase,
    IsAcceptedBookingByUserUseCase,
    InviteBookingUseCase,
    RemovePlayerInBookingTeamUseCase,
    SearchBookingsUseCase,
    GetCalendarBookingsUseCase,
    SearchBookingsManagerUseCase,
    SearchPublicBookingsUseCase,
    GetMatchByBookingId,
    MatchAddProposeUseCase,
    MatchAcceptProposeUseCase,
    MatchRemoveProposeUseCase,
    JoinPublicBookingUseCase,
    ReviewPublicJoinRequestUseCase,
    WithdrawPublicJoinRequestUseCase,
  ];
