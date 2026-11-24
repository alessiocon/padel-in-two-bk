import { Body,  Controller, Delete, Param, ParseUUIDPipe, Patch, Post, Request } from '@nestjs/common';
import {  ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JoinPublicBookingDto, ReviewPublicJoinRequestDto, PublicJoinResultDto } from '../booking.dto.js';
import { Auth } from '../../../auth/infrastructure/decorators/auth.decorator.js';

import { ReviewPublicJoinRequestUseCase } from '../../application/review.public.join.request.use-case.js';
import { WithdrawPublicJoinRequestUseCase } from '../../application/withdraw.public.join.request.use-case.js';
import { JoinPublicBookingUseCase } from '../../application/join.public.booking.use-case.js';

@ApiTags('bookings/:id/join')
@Controller('bookings/:id/join')
export class BookingJoinController {
  constructor(
    private readonly joinPublicBooking: JoinPublicBookingUseCase,
    private readonly reviewPublicJoinRequest: ReviewPublicJoinRequestUseCase,
    private readonly withdrawPublicJoinRequestUseCase: WithdrawPublicJoinRequestUseCase,
  ) {}

    @Post('')
    @Auth()
    @ApiOperation({ summary: 'Join a public game or request a place on a team' })
    @ApiOkResponse({ type: PublicJoinResultDto })
    async joinPublicGame(
      @Param('id', new ParseUUIDPipe()) bookingId: string,
      @Body() input: JoinPublicBookingDto,
      @Request() req: any,
    ): Promise<PublicJoinResultDto> {
      return this.joinPublicBooking.execute({
        bookingId,
        teamId: input.teamId,
        playerId: req.user.playerId,
        userId: req.user.sub,
        username: req.user.username,
      });
    }
  
    @Patch(':requestId')
    @Auth()
    @ApiOperation({ summary: 'Approve or reject a public game join request' })
    @ApiOkResponse({ type: PublicJoinResultDto })
    async decidePublicJoinRequest(
      @Param('id', new ParseUUIDPipe()) bookingId: string,
      @Param('requestId', new ParseUUIDPipe()) playerRequestId: string,
      @Body() input: ReviewPublicJoinRequestDto,
      @Request() req: any,
    ): Promise<PublicJoinResultDto> {
      return this.reviewPublicJoinRequest.execute({
        bookingId,
        playerRequestId,
        creatorId: req.user.sub,
        username: req.user.username,
        accepted: input.accepted,
      });
    }
  
    @Delete('')
    @Auth()
    @ApiOperation({ summary: 'Withdraw a pending public game join request' })
    @ApiOkResponse({ type: PublicJoinResultDto })
    async removePublicJoinRequest(
      @Param('id', new ParseUUIDPipe()) bookingId: string,
      @Request() req: any,
    ): Promise<PublicJoinResultDto> {
      return this.withdrawPublicJoinRequestUseCase.execute({
        bookingId,
        playerId: req.user.playerId,
        userId: req.user.sub,
        username: req.user.username,
      });
    }
}