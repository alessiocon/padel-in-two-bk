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
import { CreateBookingUseCase, GetBookingUseCase, GetAllBookingsClubUseCase } from '../application/booking-use-cases.js';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../domain/booking-errors.js';
import { Booking } from '../domain/booking.js';
import { BookingResponseDto, CreateBookingDto } from './booking.dto.js';

@ApiTags('bookings')
@Controller('clubs/:clubId/bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly getBooking: GetBookingUseCase,
    private readonly GetAllBookingsClub: GetAllBookingsClubUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiCreatedResponse({ type: BookingResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid booking or court association' })
  @ApiConflictResponse({ description: 'Court is already booked for the requested interval' })
  async create(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Body() body: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    try {
      const booking = await this.createBooking.execute({
        clubId,
        courtId: body.courtId,
        startsAt: new Date(body.startsAt),
        status: body.status,
      });
      return this.toResponse(booking);
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
  @ApiOperation({ summary: 'Get all bookings for a club' })
  @ApiOkResponse({ type: [BookingResponseDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findAllByClubId(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
  ): Promise<BookingResponseDto[]> {
    try {
      var bookings = await this.GetAllBookingsClub.execute(clubId);
      return bookings.map((booking) => this.toResponse(booking));
    } catch (error) {
      throw this.toHttpError(error);
    }
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
