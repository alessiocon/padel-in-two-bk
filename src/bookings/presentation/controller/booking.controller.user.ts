import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InviteBookingPlayerDto } from '../booking.dto.js';
import { RemovePlayerInBookingTeamReqDto } from '../booking.dto.js';
import { Auth } from '../../../auth/infrastructure/decorators/auth.decorator.js';
import { GetMatchByBookingId } from '../../application/get.match.by.bookingid.use-case.js';
import {
  BookingDetailResDto,
  BookingMatchResDto,
  UpdateBookingPlayerDto,
} from '../booking.dto.js';
import { IsAcceptedBookingByUserUseCase } from '../../application/isAccepted-booking-by-user-use-cases.js';
import { InviteBookingUseCase } from '../../application/invite.booking.use-case.js';
import { RemovePlayerInBookingTeamUseCase } from '../../application/remove.player.in.booking-team.use-case.js';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../../domain/booking-errors.js';

@ApiTags('bookings/:id/user')
@Controller('bookings/:id/user')
export class BookingUserController {
  constructor(
    private readonly getMatchByBookingId: GetMatchByBookingId,
    private readonly isAcceptedBookingByUser: IsAcceptedBookingByUserUseCase,
    private readonly inviteBooking: InviteBookingUseCase,
    private readonly removePlayerInBookingTeam: RemovePlayerInBookingTeamUseCase,
  ) {}

  @Get('')
  @Auth()
  @ApiOperation({ summary: 'Get match of a booking' })
  @ApiOkResponse({ type: BookingMatchResDto })
  @ApiNotFoundResponse({ description: 'Match not found' })
  async getMatchOfBooking(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
  ): Promise<BookingMatchResDto | null> {
    return this.getMatchByBookingId.execute(bookingId, req.user.sub, req.user.playerId);
  }

  @Patch("isAccepted")
  @Auth()
  @ApiOperation({ summary: 'Get bookings for user that can be accepted or declined' })
  @ApiOkResponse({ type: [BookingDetailResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findAllByUserAcceptOrDecline(
    @Request() req: any,
    @Body() body: UpdateBookingPlayerDto,
    @Param('id', new ParseUUIDPipe()) bookingId: string
  ): Promise<BookingDetailResDto> {
    try {
      const userId = req.user.sub;
      return  await this.isAcceptedBookingByUser.execute({
        bookingId,
        userId,
        username: req.user.username,
        isAccepted: body.accepted
      });

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("invited")
  @Auth()
  @ApiOperation({ summary: 'Invite or add a player to booking'})
  @ApiOkResponse({ type: BookingDetailResDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async invitedUser(
    @Request() req: any,
    @Body() body: InviteBookingPlayerDto,
    @Param('id', new ParseUUIDPipe()) bookingId: string
  ): Promise<BookingDetailResDto> {
    try {
      const userId = req.user.sub;
      return await this.inviteBooking.execute({
        bookingId,
        ...body,
        inviterId: userId,
        inviterUsername: req.user.username,
      });

    } catch (error) {
      throw this.toHttpError(error);
    }
  }


  @Delete("remove")
  @Auth()
  @ApiOperation({ summary: 'Remove a player from a booking team' })
  @ApiOkResponse({ type: BookingDetailResDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async removeUser(
    @Request() req: any,
    @Body() body: RemovePlayerInBookingTeamReqDto,
    @Param('id', new ParseUUIDPipe()) bookingId: string
  ): Promise<BookingDetailResDto> {
    try {
      return await this.removePlayerInBookingTeam.execute({
        bookingId,
        teamId: body.teamId,
        playerId: body.playerId,
        playerUsername: body.username,
        requesterId: req.user.sub,
        requesterUsername: req.user.username,
      });

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  private toHttpError(error: unknown): Error {
      if (error instanceof ForbiddenException) return error;
      if (error instanceof NotFoundException) return error;
      if (error instanceof BookingCourtNotFoundError || error instanceof BadRequestException) 
        return new BadRequestException(error.message);
      if (error instanceof BookingNotFoundError) return new NotFoundException(error.message);
      if (error instanceof BookingConflictError) return new ConflictException(error.message);
      if (error instanceof BadRequestException) return new BadRequestException(error.message);
      return new InternalServerErrorException('Unable to process booking request');
    }
}