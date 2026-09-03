import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubUseCase,
  ListClubsUseCase,
  UpdateClubUseCase,
} from '../application/club-use-cases.js';
import { ClubConflictError, ClubNotFoundError } from '../domain/club-errors.js';
import { Club } from '../domain/club.js';
import { CreateClubDto, ClubResponseDto, UpdateClubDto } from './club.dto.js';
import { CalendarAvailabilityResponseDto, AvailabilityQueryDto } from './calendar.dto.js';
import {CalendarAvailabilityService} from '../application/calendar-availability.service.js'

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarAvailabilityService,
  ) {}


  @Get(':id')
  @ApiOperation({ summary: 'Get court availability for a fixed interval' })
  @ApiBody({ type: UpdateClubDto })
  @ApiOkResponse({ type: CalendarAvailabilityResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Club not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe())id: string,
    @Body() body: AvailabilityQueryDto ): Promise<CalendarAvailabilityResponseDto> {
    try {
     return await  this.calendarService.calculateCalendarAvailability(id, body);
    } catch (error) {
      
    }
  }
}