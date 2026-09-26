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
  Req,
  Request,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubByManagerUseCase,
  GetClubUseCase,
  ListClubsUseCase,
} from '../application/club-use-cases.js';
import { ClubConflictError, ClubNotFoundError } from '../domain/club-errors.js';
import { Club } from '../domain/club.aggregate.js';
import { CreateClubDto, ClubsResDto, UpdateClubDto, ClubResDto } from './club.dto.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { UserRole } from '../../user/domain/user.entity.js';

@ApiTags('clubs')
@ApiBearerAuth('access-token')
@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly createClub: CreateClubUseCase,
    private readonly listClubs: ListClubsUseCase,
    private readonly getClub: GetClubUseCase,
    private readonly getClubManager: GetClubByManagerUseCase,
    // private readonly updateClub: UpdateClubUseCase,
    // private readonly deleteClub: DeleteClubUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List clubs' })
  @ApiOkResponse({ type: ClubsResDto, isArray: true })
  async findAll(): Promise<ClubsResDto[]> {
    return await this.listClubs.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by id' })
  @ApiOkResponse({ type: ClubsResDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Club not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ClubResDto> {
    try {4
      return await this.getClub.execute(id);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get(':id/manager')
  @Auth(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a club by id for manager' })
  @ApiOkResponse({ type: ClubsResDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Club not found' })
  async findOneByManager(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ClubResDto> {
    try {
      return await this.getClub.execute(id);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a club' })
  @ApiBody({ type: CreateClubDto })
  @ApiCreatedResponse({ type: ClubsResDto })
  @ApiBadRequestResponse({ description: 'Invalid club data' })
  @ApiConflictResponse({ description: 'Club name already exists' })
  async create(@Body() body: CreateClubDto): Promise<ClubsResDto> {
    try {
      return this.toResponse(await this.createClub.execute({
        ownerId: body.ownerId,
        name: body.name,
        email: body.email,
        position: body.position,
        timezone: body.timezone,
        slotPrice:  body.slotPrice,
        racketPrice: body.racketPrice,
        slotDurationMinutes: body.slotDurationMinutes, 
        openingTime: body.openingTime, 
        closingTime: body.closingTime, 
        courtInDoor: body.courtInDoor,
        courtOutDoor: body.courtOutDoor
      }));
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a club' })
  // @ApiBody({ type: UpdateClubDto })
  // @ApiOkResponse({ type: ClubResponseDto })
  // @ApiBadRequestResponse({ description: 'Invalid club data or UUID' })
  // @ApiNotFoundResponse({ description: 'Club not found' })
  // @ApiConflictResponse({ description: 'Club name already exists' })
  // async update(
  //   @Param('id', new ParseUUIDPipe()) id: string,
  //   @Body() body: UpdateClubDto,
  // ): Promise<ClubResponseDto> {
  //   try {
  //     return this.toResponse(await this.updateClub.execute({ id, ...body }));
  //   } catch (error) {
  //     throw this.toHttpError(error);
  //   }
  // }

  // @Delete(':id')
  // @HttpCode(204)
  // @ApiOperation({ summary: 'Delete a club' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({ description: 'Invalid UUID' })
  // @ApiNotFoundResponse({ description: 'Club not found' })
  // async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
  //   try {
  //     await this.deleteClub.execute(id);
  //   } catch (error) {
  //     throw this.toHttpError(error);
  //   }
  // }

  private toResponse(club: Club): ClubsResDto {
    var courtsInDoor = 0;
    var courtsOutDoor = 0;
    var averagePrice = 0;

    club.courts.forEach(court => {
      court.isIndoor ? courtsInDoor += 1 : courtsOutDoor += 1   
      averagePrice += court.price;
    });

    averagePrice /= (courtsInDoor + courtsOutDoor)

    var { courts, updatedAt, createdAt, timezone, ...prop} = club.toPrimitives();
    return { 
      ...prop, 
      courtsInDoor: courtsInDoor,
      courtsOutDoor: courtsOutDoor,
      averagePrice: averagePrice  };
  }

  private toHttpError(error: unknown): Error {
    if (error instanceof ClubNotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof ClubConflictError) {
      return new ConflictException(error.message);
    }
    if (error instanceof Error && (error.message.startsWith('Club name') || error.message.startsWith('Club email'))) {
      return new BadRequestException(error.message);
    }
    return new InternalServerErrorException('Unable to process club request');
  }
}