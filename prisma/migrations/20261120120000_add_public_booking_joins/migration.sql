CREATE TYPE "booking_join_mode" AS ENUM ('open', 'approval_required');

ALTER TYPE "BookingPlayerStatus" ADD VALUE 'REQUESTED';

ALTER TABLE "bookings"
ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "join_mode" "booking_join_mode" NOT NULL DEFAULT 'approval_required',
ADD COLUMN "min_player_level" DECIMAL(3,2),
ADD COLUMN "max_player_level" DECIMAL(3,2);

CREATE INDEX "bookings_is_public_status_starts_at_idx"
ON "bookings"("is_public", "status", "starts_at");
