import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from './../../../auth/infrastructure/decorators/auth.decorator.js';
import { GetMatchByBookingId } from './../../application/get.match.by.bookingid.use-case.js';
import { MatchAcceptProposeUseCase } from './../../application/match.accept.propose.use-case.js';
import { MatchAddProposeUseCase } from './../../application/match.add.propose.use-case.js';
import { MatchRemoveProposeUseCase } from './../../application/match.remove.propose.use-case.js';
import {
  BookingIsAcceptedMatchProposeDto,
  BookingMatchResDto,
  BookingRemoveMatchProposeDto,
  BookingResultProposeDto,
} from './../booking.dto.js';

@ApiTags('bookings/:id/match')
@Controller('bookings/:id/match')
export class BookingMatchController {
  constructor(
    private readonly getMatchByBookingId: GetMatchByBookingId,
    private readonly addMatchProposeUseCase: MatchAddProposeUseCase,
    private readonly acceptMatchProposeUseCase: MatchAcceptProposeUseCase,
    private readonly removeMatchProposeUseCase: MatchRemoveProposeUseCase,
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

  @Post('propose')
  @Auth()
  @ApiOperation({ summary: 'Propose a match result' })
  @ApiOkResponse({ type: BookingMatchResDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async addMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingResultProposeDto,
  ): Promise<BookingMatchResDto> {
    return this.addMatchProposeUseCase.execute({
      bookingId,
      userId: req.user.sub,
      playerId: req.user.playerId,
      username: req.user.username,
      ...input,
    });
  }

  @Patch('propose')
  @Auth()
  @ApiOperation({ summary: 'Accept or reject a proposed match result' })
  @ApiOkResponse({ type: BookingMatchResDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async acceptMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingIsAcceptedMatchProposeDto,
  ): Promise<BookingMatchResDto> {
    return this.acceptMatchProposeUseCase.execute({
      bookingId,
      userId: req.user.sub,
      playerId: req.user.playerId,
      username: req.user.username,
      ...input,
    });
  }

  @Delete('propose')
  @Auth()
  @ApiOperation({ summary: 'Remove a proposed match result' })
  @ApiOkResponse({ schema: { example: { response: true } } })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async removeMatchPropose(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() input: BookingRemoveMatchProposeDto,
  ): Promise<{ response: true }> {
    await this.removeMatchProposeUseCase.execute({
      bookingId,
      userId: req.user.sub,
      playerId: req.user.playerId,
      username: req.user.username,
      ...input,
    });
    return { response: true };
  }
}