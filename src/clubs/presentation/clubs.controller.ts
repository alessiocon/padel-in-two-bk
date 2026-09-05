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

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly createClub: CreateClubUseCase,
    private readonly listClubs: ListClubsUseCase,
    private readonly getClub: GetClubUseCase,
    private readonly updateClub: UpdateClubUseCase,
    private readonly deleteClub: DeleteClubUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List clubs' })
  @ApiOkResponse({ type: ClubResponseDto, isArray: true })
  async findAll(): Promise<ClubResponseDto[]> {
    return (await this.listClubs.execute()).map((club) => this.toResponse(club));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by id' })
  @ApiOkResponse({ type: ClubResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Club not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ClubResponseDto> {
    try {
      return this.toResponse(await this.getClub.execute(id));
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  // @Post()
  // @ApiOperation({ summary: 'Create a club' })
  // @ApiBody({ type: CreateClubDto })
  // @ApiCreatedResponse({ type: ClubResponseDto })
  // @ApiBadRequestResponse({ description: 'Invalid club data' })
  // @ApiConflictResponse({ description: 'Club name already exists' })
  // async create(@Body() body: CreateClubDto): Promise<ClubResponseDto> {
  //   try {
  //     return this.toResponse(await this.createClub.execute(body));
  //   } catch (error) {
  //     throw this.toHttpError(error);
  //   }
  // }

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

  private toResponse(club: Club): ClubResponseDto {
    return { ...club.toPrimitives(), courtCount: club.courts.length };
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