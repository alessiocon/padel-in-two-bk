-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'club_owner', 'admin');

-- CreateEnum
CREATE TYPE "club_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "court_status" AS ENUM ('available', 'reserved', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('reserved', 'pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingCancBy" AS ENUM ('user', 'club');

-- CreateEnum
CREATE TYPE "token_type" AS ENUM ('email_verification', 'password_reset', 'club_invitation');

-- CreateEnum
CREATE TYPE "BookingPlayerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateEnum
CREATE TYPE "booking_event_type" AS ENUM ('CREATED', 'INSERT', 'REMOVED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'STATUS_CHANGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "match_format" AS ENUM ('single_set', 'best_of_3');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(30) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" "club_status" NOT NULL DEFAULT 'active',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
    "position" VARCHAR(150) NOT NULL DEFAULT '',
    "racket_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 90,
    "opening_time" VARCHAR(5) NOT NULL DEFAULT '08:00',
    "closing_time" VARCHAR(5) NOT NULL DEFAULT '23:00',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slot_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "court_status" NOT NULL DEFAULT 'available',
    "is_indoor" BOOLEAN NOT NULL DEFAULT false,
    "offset_minutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "description" VARCHAR(255),
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'reserved',
    "cancelled_by" "BookingCancBy",
    "cancelled_at" TIMESTAMP(3),
    "cancelled_post_confirm" BOOLEAN,
    "cancellation_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_teams" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "team_number" INTEGER NOT NULL,
    "team_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "booking_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_players" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "user_id" UUID,
    "status" "BookingPlayerStatus" NOT NULL DEFAULT 'PENDING',
    "first_name" VARCHAR(24),
    "last_name" VARCHAR(24),
    "phone" VARCHAR(30),

    CONSTRAINT "booking_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_audit_logs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" "booking_event_type" NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "type" "token_type" NOT NULL,
    "reference_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "position" VARCHAR(150) NOT NULL,
    "municipality" VARCHAR(32) NOT NULL,
    "province" VARCHAR(32) NOT NULL,
    "award" VARCHAR(150) NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
    "max_teams" INTEGER NOT NULL DEFAULT 8,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "show_teams" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "team_name" VARCHAR(100) NOT NULL,
    "player1_id" UUID NOT NULL,
    "player2_id" UUID,
    "player2_fname" VARCHAR(24),
    "player2_lname" VARCHAR(24),
    "player2_phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

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
    "format" "match_format" NOT NULL DEFAULT 'single_set',
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_email_key" ON "clubs"("email");

-- CreateIndex
CREATE INDEX "clubs_owner_id_idx" ON "clubs"("owner_id");

-- CreateIndex
CREATE INDEX "courts_club_id_status_idx" ON "courts"("club_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "courts_club_id_name_key" ON "courts"("club_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "courts_id_club_id_key" ON "courts"("id", "club_id");

-- CreateIndex
CREATE INDEX "bookings_club_id_starts_at_ends_at_idx" ON "bookings"("club_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "bookings_court_id_starts_at_ends_at_idx" ON "bookings"("court_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "bookings_created_by_user_id_idx" ON "bookings"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_id_club_id_key" ON "bookings"("id", "club_id");

-- CreateIndex
CREATE INDEX "booking_teams_booking_id_idx" ON "booking_teams"("booking_id");

-- CreateIndex
CREATE INDEX "booking_players_user_id_idx" ON "booking_players"("user_id");

-- CreateIndex
CREATE INDEX "booking_audit_logs_booking_id_idx" ON "booking_audit_logs"("booking_id");

-- CreateIndex
CREATE INDEX "booking_audit_logs_user_id_idx" ON "booking_audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_hash_key" ON "tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tokens_reference_id_idx" ON "tokens"("reference_id");

-- CreateIndex
CREATE INDEX "tokens_type_idx" ON "tokens"("type");

-- CreateIndex
CREATE INDEX "tournament_matches_tournament_id_round_idx" ON "tournament_matches"("tournament_id", "round");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_tournament_id_round_match_order_key" ON "tournament_matches"("tournament_id", "round", "match_order");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_match_sets_match_id_set_number_key" ON "tournament_match_sets"("match_id", "set_number");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_club_id_fkey" FOREIGN KEY ("court_id", "club_id") REFERENCES "courts"("id", "club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_teams" ADD CONSTRAINT "booking_teams_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_players" ADD CONSTRAINT "booking_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "booking_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_players" ADD CONSTRAINT "booking_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

