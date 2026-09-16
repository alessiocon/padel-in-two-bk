import {
  BadRequestException,
  ConflictException,
  Controller,
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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBookingUseCase, GetBookingUseCase, GetAllBookingsClubUseCase, ChangeBooking } from '../application/booking-use-cases.js';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../domain/booking-errors.js';
import { Booking, BookingStatus } from '../domain/booking.js';
import { BookingResponseDto, BookingResDto, CreateBookingDto, UpdateBookingDto } from './booking.dto.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';

@ApiTags('bookings')
@Controller('clubs/:clubId/bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly getBooking: GetBookingUseCase,
    private readonly GetAllBookingsClub: GetAllBookingsClubUseCase,
    private readonly ChangeBooking: ChangeBooking
  ) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiCreatedResponse({ type: BookingResDto })
  @ApiBadRequestResponse({ description: 'Invalid booking or court association' })
  @ApiConflictResponse({ description: 'Court is already booked for the requested interval' })
  async create(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Body() body: CreateBookingDto,
    @Request() req: any
  ): Promise<BookingResDto> {
    try {
      const booking = await this.createBooking.execute({ ...body,
        clubId: clubId,
        userId: req.user.id,
        status: BookingStatus.PENDING
      });
      return booking;

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  @ApiOkResponse({ type: BookingResponseDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findOne(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BookingResponseDto> {
    try {
      return this.toResponse(await this.getBooking.execute(id, clubId));
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings for a club' })
  @ApiOkResponse({ type: [BookingResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findAllByClubId(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Query('date') date?: string
  ): Promise<BookingResDto[]> {
    try {
      date ??= new Date().toISOString().slice(0, 10);
      return  await this.GetAllBookingsClub.execute(clubId , date );

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Change booking by id' })
  @ApiOkResponse({ type: [BookingResponseDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('CLUB_OWNER', 'ADMIN')
  async changeBookingById(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() body: UpdateBookingDto
    // @CurrentUser() owner: User
  ) {
    return await this.ChangeBooking.execute({
      clubId,
      bookingId,
      userId: req.user.userId,
      status: body.status
    }
    );
  }


  private toResponse(booking: Booking): BookingResponseDto {
    return booking.toPrimitives();
  }

  private toHttpError(error: unknown): Error {
    if (error instanceof BookingCourtNotFoundError) return new BadRequestException(error.message);
    if (error instanceof BookingNotFoundError) return new NotFoundException(error.message);
    if (error instanceof BookingConflictError) return new ConflictException(error.message);
    if (error instanceof Error) return new BadRequestException(error.message);
    return new InternalServerErrorException('Unable to process booking request');
  }
}
