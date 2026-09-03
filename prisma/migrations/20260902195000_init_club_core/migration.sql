-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "club_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "court_status" AS ENUM ('available', 'reserved', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "calendar_status" AS ENUM ('open', 'closed', 'partially_available');

-- CreateTable
CREATE TABLE "clubs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" "club_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "court_status" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_slots" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "calendar_status" NOT NULL,
    "isBookable" BOOLEAN NOT NULL,
    "availableCourtCount" INTEGER NOT NULL,
    "availableCourtIds" UUID[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courts_clubId_status_idx" ON "courts"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "courts_clubId_name_key" ON "courts"("clubId", "name");

-- CreateIndex
CREATE INDEX "calendar_slots_clubId_startsAt_endsAt_idx" ON "calendar_slots"("clubId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_slots_clubId_startsAt_endsAt_key" ON "calendar_slots"("clubId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_slots" ADD CONSTRAINT "calendar_slots_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
