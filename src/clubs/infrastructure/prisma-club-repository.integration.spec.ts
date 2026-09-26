import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PrismaService } from '../../database/prisma.service.js';
import { ClubsModule } from '../clubs.module.js';
import { Club } from '../domain/club.aggregate.js';
import { ClubConflictError } from '../domain/club-errors.js';
import { PrismaClubRepository } from './prisma-club-repository.js';

const integrationTest = process.env.RUN_DB_INTEGRATION_TESTS === 'true' ? it : it.skip;

/**
 * Helper per inizializzare il TestingModule con ClubsModule e PrismaService
 */
async function createTestingContext() {
  const moduleRef = await Test.createTestingModule({
    imports: [ClubsModule],
  }).compile();

  const prisma = moduleRef.get(PrismaService);
  const repository = new PrismaClubRepository(prisma);

  return { moduleRef, prisma, repository };
}

/**
 * Helper per creare un Utente Proprietario temporaneo nel DB.
 */
async function createTestOwner(prisma: PrismaService) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: `owner_${randomUUID()}@example.com`,
      lastName: 'Test Owner',
      firstName: 'firstName',
      role: 'CLUB_OWNER',
    },
  });
}

describe('PrismaClubRepository (integration)', () => {
  integrationTest('persists the complete club lifecycle in PostgreSQL', async () => {
    const { moduleRef, prisma, repository } = await createTestingContext();
    const owner = await createTestOwner(prisma);

    const club = Club.create({
      name: `Integration Club ${randomUUID()}`,
      email: `${randomUUID()}@example.com`,
      ownerId: owner.id,
      courtCount: 2,
    });

    try {
      const created = await repository.create(club);
      expect((await repository.findById(created.id))?.name).toBe(club.name);

      club.rename(`${club.name} Updated`);
      expect((await repository.update(club)).name).toBe(club.name);

      await repository.delete(club.id);
      expect(await repository.findById(club.id)).toBeNull();
    } finally {
      await prisma.user.delete({ where: { id: owner.id } });
      await moduleRef.close();
    }
  });

  integrationTest('rolls back the club when court creation fails', async () => {
    const { moduleRef, prisma, repository } = await createTestingContext();
    const owner = await createTestOwner(prisma);

    const id = randomUUID();
    const now = new Date();
    const club = Club.reconstitute({
      id,
      ownerId: owner.id,
      name: `Rollback Club ${randomUUID()}`,
      status: 'active',
      email: `${randomUUID()}@example.com`,
      slotDurationMinutes: 90,
      openingTime: '08:00',
      closingTime: '23:00',
      createdAt: now,
      updatedAt: now,
      courts: [
        { id: randomUUID(), clubId: id, name: 'campo duplicato', status: 'available' },
        { id: randomUUID(), clubId: id, name: 'campo duplicato', status: 'available' },
      ],
    });

    try {
      await expect(repository.create(club)).rejects.toThrow();
      expect(await prisma.club.findUnique({ where: { id } })).toBeNull();
      expect(await prisma.court.findMany({ where: { clubId: id } })).toEqual([]);
    } finally {
      await prisma.user.delete({ where: { id: owner.id } });
      await moduleRef.close();
    }
  });

  integrationTest('rejects duplicate normalized club emails', async () => {
    const { moduleRef, prisma, repository } = await createTestingContext();
    const owner = await createTestOwner(prisma);

    const email = `${randomUUID()}@example.com`;
    const first = Club.create({
      name: `Email Club ${randomUUID()}`,
      email: email.toUpperCase(),
      ownerId: owner.id,
      courtCount: 1,
    });
    const duplicate = Club.create({
      name: `Email Duplicate ${randomUUID()}`,
      email,
      ownerId: owner.id,
      courtCount: 1,
    });

    try {
      await repository.create(first);
      await expect(repository.create(duplicate)).rejects.toBeInstanceOf(ClubConflictError);
    } finally {
      await prisma.club.deleteMany({ where: { email: email.toLowerCase() } });
      await prisma.user.delete({ where: { id: owner.id } });
      await moduleRef.close();
    }
  });

  integrationTest('serves the complete club lifecycle over HTTP', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ClubsModule] }).compile();
    const app: INestApplication = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const prisma = app.get(PrismaService);
    const owner = await createTestOwner(prisma);

    const name = `HTTP Integration Club ${randomUUID()}`;
    let clubId: string | undefined;

    try {
      const created = await request(app.getHttpServer())
        .post('/clubs')
        .send({
          name,
          email: `${randomUUID()}@example.com`,
          ownerId: owner.id,
          courtCount: 2,
        })
        .expect(201);

      clubId = created.body.id;

      await request(app.getHttpServer()).get(`/clubs/${clubId}`).expect(200);
      await request(app.getHttpServer())
        .patch(`/clubs/${clubId}`)
        .send({ name: `${name} Updated` })
        .expect(200);

      await request(app.getHttpServer()).delete(`/clubs/${clubId}`).expect(204);
      await request(app.getHttpServer()).get(`/clubs/${clubId}`).expect(404);
    } finally {
      if (clubId) {
        await prisma.club.deleteMany({ where: { id: clubId } });
      }
      await prisma.user.delete({ where: { id: owner.id } });
      await app.close();
    }
  });
});