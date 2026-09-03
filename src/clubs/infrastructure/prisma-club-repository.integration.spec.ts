import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PrismaService } from '../../database/prisma.service.js';
import { ClubsModule } from '../clubs.module.js';
import { Club } from '../domain/club.js';
import { ClubConflictError } from '../domain/club-errors.js';
import { PrismaClubRepository } from './prisma-club-repository.js';

const integrationTest = process.env.RUN_DB_INTEGRATION_TESTS === 'true' ? it : it.skip;

describe('PrismaClubRepository (integration)', () => {
  integrationTest('persists the complete club lifecycle in PostgreSQL', async () => {
    const prisma = new PrismaService();
    const repository = new PrismaClubRepository(prisma);
    const club = Club.create(`Integration Club ${randomUUID()}`, `${randomUUID()}@example.com`, undefined, 2);

    try {
      const created = await repository.create(club);
      expect((await repository.findById(created.id))?.name).toBe(club.name);

      club.rename(`${club.name} Updated`);
      expect((await repository.update(club)).name).toBe(club.name);

      await repository.delete(club.id);
      expect(await repository.findById(club.id)).toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  });

  integrationTest('rolls back the club when court creation fails', async () => {
    const prisma = new PrismaService();
    const repository = new PrismaClubRepository(prisma);
    const id = randomUUID();
    const now = new Date();
    const club = Club.reconstitute({
      id,
      name: `Rollback Club ${randomUUID()}`,
      status: 'active',
      email: `${randomUUID()}@example.com`,
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
      await prisma.$disconnect();
    }
  });

  integrationTest('rejects duplicate normalized club emails', async () => {
    const prisma = new PrismaService();
    const repository = new PrismaClubRepository(prisma);
    const email = `${randomUUID()}@example.com`;
    const first = Club.create(`Email Club ${randomUUID()}`, email.toUpperCase(), undefined, 1);
    const duplicate = Club.create(`Email Duplicate ${randomUUID()}`, email, undefined, 1);

    try {
      await repository.create(first);
      await expect(repository.create(duplicate)).rejects.toBeInstanceOf(ClubConflictError);
    } finally {
      await prisma.club.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
  });

  integrationTest('serves the complete club lifecycle over HTTP', async () => {
    const module = await Test.createTestingModule({ imports: [ClubsModule] }).compile();
    const app: INestApplication = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const name = `HTTP Integration Club ${randomUUID()}`;
    let clubId: string | undefined;
    try {
      const created = await request(app.getHttpServer())
        .post('/clubs')
        .send({ name, email: `${randomUUID()}@example.com`, courtCount: 2 })
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
      const prisma = app.get(PrismaService);
      if (clubId) {
        await prisma.club.deleteMany({ where: { id: clubId } });
      }
      await app.close();
    }
  });
});