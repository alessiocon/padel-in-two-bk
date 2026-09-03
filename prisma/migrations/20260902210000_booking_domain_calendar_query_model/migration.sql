-- Remove the persisted calendar snapshot; availability is now a query model.
DROP TABLE IF EXISTS "calendar_slots";
DROP TYPE IF EXISTS "calendar_status";

CREATE TYPE "booking_status" AS ENUM ('free', 'reserved', 'searching', 'blocked');

CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "courtId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_clubId_startsAt_endsAt_idx" ON "bookings"("clubId", "startsAt", "endsAt");
CREATE INDEX "bookings_courtId_startsAt_endsAt_idx" ON "bookings"("courtId", "startsAt", "endsAt");
CREATE UNIQUE INDEX "courts_id_clubId_key" ON "courts"("id", "clubId");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_courtId_fkey"
    FOREIGN KEY ("courtId", "clubId") REFERENCES "courts"("id", "clubId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_active_overlap"
    EXCLUDE USING GIST (
        "courtId" WITH =,
        tsrange("startsAt", "endsAt", '[)') WITH &&
    ) WHERE ("status" <> 'free');
