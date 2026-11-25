import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Post,
  Body,
  Request,
  Patch,
  Query,
  Delete,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { BookingConflictError, BookingCourtNotFoundError, BookingNotFoundError } from '../domain/booking-errors.js';
import { BookingStatus } from '../domain/booking.aggregate.js';
import { BookingDetailResDto, DeleteBookingDto, RestoreBookingStatusDto, CreateBookingDto, BookingQuickResDto, PublicBookingResDto } from './booking.dto.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { CreateBookingUseCase } from '../application/create-booking-use-cases.js';
import { SearchBookingsUseCase } from '../application/search.bookings.use-case.js';
import { CancelPrenotationUseCase } from '../application/cancel.prenotation.use-case.js';
import { RestorePrenotationUseCase } from '../application/restore.prenotation.use-case.js';
import { SearchBookingsManagerUseCase } from '../application/search.bookings.manager.use-case.js';
import { GetBookingByIdUseCase } from '../application/get.booking.by-id.use-case.js';
import { AcceptBookingUseCase } from '../application/accept.boocking.use-case.js';
import { StartBookingUseCase } from '../application/start.boocking.use-case.js';
import { GetCalendarBookingsUseCase } from '../application/get.calendar.bookings.use-case.js';
import { CalendarBookingResDto, SearchBookingQueryDto } from './booking.dto.js';
import { SearchPublicBookingsUseCase } from '../application/search.public.bookings.use-case.js';
import { SearchResponseDto } from '../../cammon/search.res.dto.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly getBooking: GetBookingByIdUseCase,
    private readonly searchBookings: SearchBookingsUseCase,
    private readonly searchBookingsManager: SearchBookingsManagerUseCase,
    private readonly calendarBookings: GetCalendarBookingsUseCase,
    private readonly CancelBooking: CancelPrenotationUseCase,
    private readonly AcceptBooking: AcceptBookingUseCase,
    private readonly StartBooking: StartBookingUseCase,
    private readonly RestorePrenotation: RestorePrenotationUseCase,
    private readonly searchPublicBookings: SearchPublicBookingsUseCase,
  ) {}


  @Get("")
  @ApiOperation({ summary: 'search bookings for a prenotation of club' })
  @ApiOkResponse({ type: [BookingQuickResDto] })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({ name: 'clubId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, isArray: true })
  async serachBookings(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) search: SearchBookingQueryDto,
    ): Promise<BookingQuickResDto[]> {
    try {
      return await this.searchBookings.execute({
        clubId: search.clubId,
        from: search.from,
        to: search.to,
        status: search.status,
      });
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get('public')
  @ApiOperation({ summary: 'List upcoming public padel games' })
  @ApiQuery({ name: 'clubId', required: false, type: String })
  @ApiOkResponse({ type: [PublicBookingResDto] })
  async listPublicBookings(
    @Query('clubId') clubId?: string,
  ): Promise<PublicBookingResDto[]> {

    return this.searchPublicBookings.execute({ clubId: clubId});
  }


  @Get("clubs/:clubId/manager")
  @Auth()
  @ApiOperation({ summary: 'search bookings for a club manager' })
  @ApiExtraModels(SearchResponseDto, BookingQuickResDto)
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SearchResponseDto) },
        { type: 'object', required: ['data'], properties: { data: { type: 'array', items: { $ref: getSchemaPath(BookingQuickResDto) } } } },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({ name: 'clubId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'playerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, isArray: true })
  async searchBookingForManager(
    @Request() req: any,
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) search: SearchBookingQueryDto,
  ): Promise<SearchResponseDto<BookingQuickResDto>> {
    try {
      return await this.searchBookingsManager.execute({
        clubId,
        from: search.from,
        to: search.to,
        playerId: search.playerId,
        status: search.status,
        take: search.take,
        skip: search.skip,
        page: search.page,
        member: req.user.sub,
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
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, isArray: true })
  async searchBookingOfUser(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clubId') clubId?: string,
    @Query('status', new ParseArrayPipe({ items: String, optional: true })) status?: BookingStatus[],
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

  @Get('user/calendar')
  @Auth()
  @ApiOperation({ summary: 'Get all bookings in a calendar date range' })
  @ApiOkResponse({ type: [CalendarBookingResDto] })
  @ApiBadRequestResponse({ description: 'Invalid date range or search filters' })
  async getCalendarBookings(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) search: SearchBookingQueryDto,
  ): Promise<CalendarBookingResDto[]> {
    try {
      return await this.calendarBookings.execute(
        {...search,  
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
