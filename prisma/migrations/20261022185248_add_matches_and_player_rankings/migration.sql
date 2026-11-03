-- AlterTable
ALTER TABLE "players" ADD COLUMN     "level" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matches_played" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reliability_score" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "player_level_history" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "booking_match_id" UUID,
    "tournament_match_id" UUID,
    "level_before" DECIMAL(3,2) NOT NULL,
    "level_after" DECIMAL(3,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_level_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_matches" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "winner_team_number" INTEGER NOT NULL,
    "format" "match_format" NOT NULL DEFAULT 'single_set',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "booking_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_match_sets" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "team1_games" INTEGER NOT NULL DEFAULT 0,
    "team2_games" INTEGER NOT NULL DEFAULT 0,
    "tie_break" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "booking_match_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_level_history_player_id_idx" ON "player_level_history"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_matches_booking_id_key" ON "booking_matches"("booking_id");

-- CreateIndex
CREATE INDEX "booking_matches_booking_id_idx" ON "booking_matches"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_match_sets_match_id_set_number_key" ON "booking_match_sets"("match_id", "set_number");

-- CreateIndex
CREATE INDEX "booking_teams_booking_id_team_number_idx" ON "booking_teams"("booking_id", "team_number");

-- AddForeignKey
ALTER TABLE "player_level_history" ADD CONSTRAINT "player_level_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_level_history" ADD CONSTRAINT "player_level_history_booking_match_id_fkey" FOREIGN KEY ("booking_match_id") REFERENCES "booking_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_level_history" ADD CONSTRAINT "player_level_history_tournament_match_id_fkey" FOREIGN KEY ("tournament_match_id") REFERENCES "tournament_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_matches" ADD CONSTRAINT "booking_matches_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_match_sets" ADD CONSTRAINT "booking_match_sets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "booking_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
