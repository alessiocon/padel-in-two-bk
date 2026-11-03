import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Request,
  Patch,
  Query,
  Delete,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../domain/booking-errors.js';
import { BookingStatus } from '../domain/booking.aggregate.js';
import { BookingDetailResDto, DeleteBookingDto, RestoreBookingStatusDto, CreateBookingDto, UpdateBookingPlayerDto, InviteBookingPlayerDto, RemovePlayerInBookingTeamReqDto, BookingQuickResDto, BookingResultProposeDto, BookingIsAcceptedMatchProposeDto, BookingRemoveMatchProposeDto, BookingMatchResDto } from './booking.dto.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { CreateBookingUseCase } from '../application/create-booking-use-cases.js';
import { IsAcceptedBookingByUserUseCase } from '../application/isAccepted-booking-by-user-use-cases.js';
import { InviteBookingUseCase } from '../application/invite.booking.use-case.js';
import { RemovePlayerInBookingTeamUseCase } from '../application/remove.player.in.booking-team.use-case.js';
import { SearchBookingsUseCase } from '../application/search.bookings.use-case.js';
import { CancelPrenotationUseCase } from '../application/cancel.prenotation.use-case.js';
import { RestorePrenotationUseCase } from '../application/restore.prenotation.use-case.js';
import { SearchBookingsManagerUseCase } from '../application/search.bookings.manager.use-case.js';
import { GetBookingByIdUseCase } from '../application/get.booking.by-id.use-case.js';
import { AcceptBookingUseCase } from '../application/accept.boocking.use-case.js';
import { MatchAddProposeUseCase } from '../application/match.add.propose.use-case.js';
import { MatchAcceptProposeUseCase } from '../application/match.accept.propose.use-case.js';
import { MatchRemoveProposeUseCase } from '../application/match.remove.propose.use-case.js';
import { GetMatchByBookingId} from '../application/get.match.by.bookingid.use-case.js';
import { StartBookingUseCase } from '../application/start.boocking.use-case.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly getBooking: GetBookingByIdUseCase,
    private readonly searchBookings: SearchBookingsUseCase,
    private readonly searchBookingsManager: SearchBookingsManagerUseCase,
    private readonly CancelBooking: CancelPrenotationUseCase,
    private readonly AcceptBooking: AcceptBookingUseCase,
    private readonly StartBooking: StartBookingUseCase,
    private readonly RestorePrenotation: RestorePrenotationUseCase,
    private readonly GetMatchByBookingId: GetMatchByBookingId,

    private readonly AddMatchPropose: MatchAddProposeUseCase,
    private readonly AcceptMatchPropose: MatchAcceptProposeUseCase,
    private readonly MatchRemovePropose: MatchRemoveProposeUseCase,
    private readonly isAcceptedBookingByUser: IsAcceptedBookingByUserUseCase,
    private readonly inviteBooking: InviteBookingUseCase,
    private readonly removePlayerInBookingTeam: RemovePlayerInBookingTeamUseCase
  ) {}


  @Get("")
  @ApiOperation({ summary: 'search bookings for a prenotation of club' })
  @ApiOkResponse({ type: [BookingQuickResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async serachBookings(
    @Query('clubId') clubId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<BookingQuickResDto[]> {
    try {
      return await this.searchBookings.execute({ 
        clubId, 
        from, 
        to, 
      });
    } catch (error) {
      throw this.toHttpError(error);
    }
  } 

  @Get("clubs/:clubId/manager")
  @Auth()
  @ApiOperation({ summary: 'search bookings for a club manager' })
  @ApiOkResponse({ type: [BookingQuickResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({ name: 'clubId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'playerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async searchBookingForManager(
    @Request() req: any,
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('playerId') playerId?: string,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingQuickResDto[]> {
    try {
      return await this.searchBookingsManager.execute({
        clubId,
        from,
        to,
        playerId,
        status,
        member: req.user.sub
      });

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get("user")
  @Auth()
  @ApiOperation({ summary: 'search bookings for user' })
  @ApiOkResponse({ type: [BookingQuickResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'clubId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async searchBookingOfUser(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clubId') clubId?: string,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingQuickResDto[]> {
    try {
      return  await this.searchBookings.execute({ clubId, from, to, status, 
        createdById: req.user.sub, 
        playerId: req.user.playerId
      });
    } catch (error) {
      throw this.toHttpError(error);
    }
  }


  @Post("")
  @Auth()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiCreatedResponse({ type: BookingQuickResDto })
  @ApiBadRequestResponse({ description: 'Invalid booking or court association' })
  @ApiConflictResponse({ description: 'Court is already booked for the requested interval' })
  async create(
    @Body() input: CreateBookingDto,
    @Request() req: any
  ): Promise<BookingQuickResDto> {
    try {
      const booking = await this.createBooking.execute(
      { 
        ...input,
        createdById: req.user.sub,
        createdPlayerId: req.user.playerId,
        username: req.user.username,
        status: BookingStatus.PENDING,
        createdByStaff: false
      });
      return booking;

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post("/staff")
  @Auth()
  @ApiOperation({ summary: 'Create a booking by Staff' })
  @ApiCreatedResponse({ type: BookingQuickResDto })
  @ApiBadRequestResponse({ description: 'Invalid booking or court association' })
  @ApiConflictResponse({ description: 'Court is already booked for the requested interval' })
  async createByStaff(
    @Body() input: CreateBookingDto,
    @Request() req: any
  ): Promise<BookingQuickResDto> {
    try {
      const booking = await this.createBooking.execute(
      { 
        ...input,
        createdById: req.user.sub,
        createdPlayerId: req.user.playerId,
        username: req.user.username,
        status: BookingStatus.PENDING,
        createdByStaff: true
      });
      return booking;

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Patch(":id/user/isAccepted")
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

  @Post(":id/user/invited")
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
        teamId: body.teamId,
        inviterId: userId,
        inviterUsername: req.user.username,
        playerId: body.playerId,
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      });

    } catch (error) {
      throw this.toHttpError(error);
    }
  }


  @Delete(":id/user/remove")
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


  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a booking by id' })
  @ApiOkResponse({ type: BookingDetailResDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findOne(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BookingDetailResDto> {
    try {
      return await this.getBooking.execute(id, req.user.sub, req.user.playerId);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete booking by Id' })
  @ApiOkResponse({ type: [Boolean] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async deleteBookingByClub(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: DeleteBookingDto
  ) : Promise<BookingDetailResDto> {
    let booking =  await this.CancelBooking.execute({
      bookingId,
      username: req.user.username,
      userId: req.user.sub,
      reason: input.reason ?? "",
      isStaff: input.isStaff
    });
    return booking;
  }

  @Patch(':id/accept')
  @Auth()
  @ApiOperation({ summary: 'Accept booking by Id' })
  @ApiOkResponse({ type: [Boolean] })
  @ApiNotFoundResponse({ description: 'Accept booking by Id' })
  async acceptBooking(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
  ) : Promise<boolean> {
    return await this.AcceptBooking.execute(
      bookingId,
      req.user.sub,
      req.user.username
    );
  }

  @Patch(':id/start')
  @Auth()
  @ApiOperation({ summary: 'Start booking by Id' })
  @ApiOkResponse({ type: [Boolean] })
  @ApiNotFoundResponse({ description: 'Start booking by Id' })
  async startBooking(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
  ) : Promise<boolean> {
    return await this.StartBooking.execute(
      bookingId,
      req.user.sub,
      req.user.username
    );
  }


  @Patch(':id/restore')
  @Auth()
  @ApiOperation({ summary: 'Restore Status of booking by Id' })
  @ApiOkResponse({ type: [BookingDetailResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async restoreBookingStatusById(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: RestoreBookingStatusDto
  ) : Promise<BookingDetailResDto> {
    return await this.RestorePrenotation.execute(
      bookingId,
      req.user.sub,
      req.user.username,
      input.isStaff
    );
  }

  @Get(':id/match')
  @Auth()
  @ApiOperation({ summary: 'get Match of e booking'})
  @ApiOkResponse({ type: BookingMatchResDto || null  })
  @ApiNotFoundResponse({ description: 'match not found' })
  async getMatchOfBooking(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
  ) : Promise<BookingMatchResDto | null> {

    return await this.GetMatchByBookingId.execute(
        bookingId,
        req.user.sub,
        req.user.playerId
    );
  }



  @Post(':id/match/propose')
  @Auth()
  @ApiOperation({ summary: 'Add Propose of match'})
  @ApiOkResponse({ type: [BookingDetailResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async addMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingResultProposeDto
  ) : Promise<BookingMatchResDto> {

    return await this.AddMatchPropose.execute(
      {
        bookingId,
        userId: req.user.sub,
        playerId: req.user.playerId,
        username: req.user.username,
        ...input
      }
    );
  }

  @Patch(':id/match/propose')
  @Auth()
  @ApiOperation({ summary: 'Set Score of match' })
  @ApiOkResponse({ type: [BookingDetailResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async acceptMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingIsAcceptedMatchProposeDto
  ) : Promise<BookingMatchResDto> {

    return await this.AcceptMatchPropose.execute(
      {
        bookingId,
        userId: req.user.sub,
        playerId: req.user.playerId,
        username: req.user.username,
        ...input
      }
    );
  }

  @Delete(':id/match/propose')
  @Auth()
  @ApiOperation({ summary: 'Delete propose' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async removeMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingRemoveMatchProposeDto

  ) : Promise<any> {

    await this.MatchRemovePropose.execute(
      {
        bookingId,
        userId: req.user.sub,
        playerId: req.user.playerId,
        username: req.user.username,
        ...input 
      }
    );

    return {response: true}
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
