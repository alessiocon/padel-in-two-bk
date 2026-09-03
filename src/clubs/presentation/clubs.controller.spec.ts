import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CreateClubUseCase,
  DeleteClubUseCase,
  GetClubUseCase,
  ListClubsUseCase,
  UpdateClubUseCase,
} from '../application/club-use-cases.js';
import { Club } from '../domain/club.js';
import { ClubConflictError } from '../domain/club-errors.js';
import { CLUB_REPOSITORY, type IClubRepository } from '../domain/club-repository.js';
import { ClubsController } from './clubs.controller.js';

class InMemoryClubRepository implements IClubRepository {
  private readonly records = new Map<string, Club>();

  async findAll(): Promise<Club[]> {
    return [...this.records.values()];
  }

  async findById(id: string): Promise<Club | null> {
    return this.records.get(id) ?? null;
  }

  async create(club: Club): Promise<Club> {
    if ([...this.records.values()].some((record) => record.name === club.name || record.email === club.email)) {
      throw new ClubConflictError(club.name);
    }
    this.records.set(club.id, club);
    return club;
  }

  async update(club: Club): Promise<Club> {
    this.records.set(club.id, club);
    return club;
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}

describe('ClubsController (HTTP)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const repository = new InMemoryClubRepository();
    const module = await Test.createTestingModule({
      controllers: [ClubsController],
      providers: [
        { provide: CLUB_REPOSITORY, useValue: repository },
        {
          provide: CreateClubUseCase,
          useFactory: () => new CreateClubUseCase(repository),
        },
        {
          provide: ListClubsUseCase,
          useFactory: () => new ListClubsUseCase(repository),
        },
        {
          provide: GetClubUseCase,
          useFactory: () => new GetClubUseCase(repository),
        },
        {
          provide: UpdateClubUseCase,
          useFactory: () => new UpdateClubUseCase(repository),
        },
        {
          provide: DeleteClubUseCase,
          useFactory: () => new DeleteClubUseCase(repository),
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('supports the complete club CRUD flow', async () => {
    const created = await request(app.getHttpServer())
      .post('/clubs')
      .send({ name: 'Padel Milano', email: 'info@padelmilano.it', courtCount: 2 })
      .expect(201);

    expect(created.body.name).toBe('Padel Milano');
    expect(created.body.status).toBe('active');
    expect(created.body.courtCount).toBe(2);

    await request(app.getHttpServer()).get('/clubs').expect(200).expect([created.body]);
    await request(app.getHttpServer()).get(`/clubs/${created.body.id}`).expect(200);

    await request(app.getHttpServer())
      .patch(`/clubs/${created.body.id}`)
      .send({ name: 'Padel Milano Centro' })
      .expect(200)
      .expect(({ body }) => expect(body.name).toBe('Padel Milano Centro'));

    await request(app.getHttpServer()).delete(`/clubs/${created.body.id}`).expect(204).expect('');
    await request(app.getHttpServer()).get(`/clubs/${created.body.id}`).expect(404);
  });

  it('rejects invalid payloads and identifiers', async () => {
    await request(app.getHttpServer()).post('/clubs').send({ name: ' ' }).expect(400);
    await request(app.getHttpServer()).post('/clubs').send({ name: 'Padel', courtCount: 0 }).expect(400);
    await request(app.getHttpServer()).post('/clubs').send({ name: 'Padel', courtCount: 1.5 }).expect(400);
    await request(app.getHttpServer()).post('/clubs').send({ name: 'Padel', extra: true }).expect(400);
    await request(app.getHttpServer()).get('/clubs/not-a-uuid').expect(400);
  });

  it('returns conflict for duplicate names', async () => {
    await request(app.getHttpServer()).post('/clubs').send({ name: 'Padel Roma', email: 'info@padelroma.it', courtCount: 1 }).expect(201);
    await request(app.getHttpServer()).post('/clubs').send({ name: 'Padel Roma', email: 'info@padelroma.it', courtCount: 1 }).expect(409);
  });

  it('returns conflict for duplicate emails', async () => {
    await request(app.getHttpServer())
      .post('/clubs')
      .send({ name: 'Padel Uno', email: 'INFO@PADEL.IT', courtCount: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/clubs')
      .send({ name: 'Padel Due', email: 'info@padel.it', courtCount: 1 })
      .expect(409);
  });

  it('requires a valid club email', async () => {
    await request(app.getHttpServer())
      .post('/clubs')
      .send({ name: 'Padel Invalid', email: 'invalid-email', courtCount: 1 })
      .expect(400);
  });

  it('publishes all club routes in the OpenAPI document', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('PadelInTwo API').build(),
    );

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(['/clubs', '/clubs/{id}']),
    );
    expect(document.paths['/clubs']).toEqual(
      expect.objectContaining({ get: expect.any(Object), post: expect.any(Object) }),
    );
    expect(document.paths['/clubs/{id}']).toEqual(
      expect.objectContaining({
        get: expect.any(Object),
        patch: expect.any(Object),
        delete: expect.any(Object),
      }),
    );
  });
});