-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "court_id" UUID,
    "team1_id" UUID,
    "team2_id" UUID,
    "winner_team_id" UUID,
    "round" INTEGER NOT NULL,
    "match_order" INTEGER NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'scheduled',
    "scheduled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_match_sets" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "team1_games" INTEGER NOT NULL DEFAULT 0,
    "team2_games" INTEGER NOT NULL DEFAULT 0,
    "tie_break" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tournament_match_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_matches_tournament_id_round_idx" ON "tournament_matches"("tournament_id", "round");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_tournament_id_round_match_order_key" ON "tournament_matches"("tournament_id", "round", "match_order");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_match_sets_match_id_set_number_key" ON "tournament_match_sets"("match_id", "set_number");

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "tournament_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_match_sets" ADD CONSTRAINT "tournament_match_sets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tournament_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
