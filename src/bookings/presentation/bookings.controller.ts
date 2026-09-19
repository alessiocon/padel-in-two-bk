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
  Delete,
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
import { CreateBookingUseCase, GetBookingUseCase, GetAllBookingsClubUseCase, ChangeBooking, GetAllBookingsUserUseCase, DeleteBookingUseCase } from '../application/booking-use-cases.js';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../domain/booking-errors.js';
import { Booking, BookingStatus } from '../domain/booking.js';
import { BookingResponseDto, BookingResDto, CreateBookingDto, UpdateBookingDto, BookingUserResDto } from './booking.dto.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly getBooking: GetBookingUseCase,
    private readonly GetAllBookingsClub: GetAllBookingsClubUseCase,
    private readonly GetAllBookingsUser: GetAllBookingsUserUseCase,
    private readonly ChangeBooking: ChangeBooking,
    private readonly DeleteBooking: DeleteBookingUseCase
  ) {}

  @Post("clubs/:clubId")
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

  @Get("clubs/:clubId")
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

  @Get("user")
  @Auth()
  @ApiOperation({ summary: 'Get bookings for user' })
  @ApiOkResponse({ type: [BookingResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findAllByUser(
    @Request() req: any
  ): Promise<BookingUserResDto[]> {
    try {
      return  await this.GetAllBookingsUser.execute(req.user.id);

    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  @ApiOkResponse({ type: BookingResponseDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BookingResponseDto> {
    try {
      return this.toResponse(await this.getBooking.execute(id));
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
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
    @Body() body: UpdateBookingDto
    // @CurrentUser() owner: User
  ): Promise<Booking> {
    return await this.ChangeBooking.execute({
      clubId: body.clubId,
      bookingId,
      userId: req.user.id,
      status: body.status
    });
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete booking by Id' })
  @ApiOkResponse({ type: [Boolean] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async deleteBooking(
    @Param('id', new ParseUUIDPipe()) bookingId: string,
    @Request() req: any,
  ) : Promise<BookingResponseDto> {

    let booking =  await this.DeleteBooking.execute( bookingId, req.user.id);
    return this.toResponse(booking)
  }


  private toResponse(booking: Booking): BookingResponseDto {
    return booking.toPrimitives();
  }

  private toHttpError(error: unknown): Error {
    if (error instanceof BookingCourtNotFoundError || error instanceof BadRequestException) 
      return new BadRequestException(error.message);
    if (error instanceof BookingNotFoundError) return new NotFoundException(error.message);
    if (error instanceof BookingConflictError) return new ConflictException(error.message);
    if (error instanceof BadRequestException) return new BadRequestException(error.message);
    return new InternalServerErrorException('Unable to process booking request');
  }
}
