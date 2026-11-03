BEGIN;

/* ---------- 1. NUOVE TABELLE ---------- */
CREATE TABLE "players" (
    "id"         UUID        NOT NULL,
    "user_id"    UUID        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "managers" (
    "id"         UUID        NOT NULL,
    "user_id"    UUID        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "managers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "players_user_id_key"  ON "players"("user_id");
CREATE UNIQUE INDEX "managers_user_id_key" ON "managers"("user_id");

ALTER TABLE "players"  ADD CONSTRAINT "players_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "managers" ADD CONSTRAINT "managers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


/* ---------- 2. BACKFILL PROFILI ---------- */
-- id e updated_at non hanno default nel DB (li gestisce Prisma lato client): vanno passati a mano
INSERT INTO "players" ("id", "user_id", "updated_at")
SELECT gen_random_uuid(), u."id", now()
  FROM "users" u;

INSERT INTO "managers" ("id", "user_id", "updated_at")
SELECT gen_random_uuid(), x."user_id", now()
  FROM (
        SELECT "id" AS "user_id" FROM "users" WHERE "role" = 'club_owner'
        UNION
        SELECT "owner_id"        FROM "clubs"        -- copre anche owner "sporchi"
       ) x;


/* ---------- 3. ADMIN (prima di perdere "role") ---------- */
ALTER TABLE "users" ADD COLUMN "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "is_platform_admin" = true WHERE "role" = 'admin';


/* ---------- 4. CLUBS: owner_id -> manager_id ---------- */
ALTER TABLE "clubs" ADD COLUMN "manager_id" UUID;

UPDATE "clubs" c
   SET "manager_id" = m."id"
  FROM "managers" m
 WHERE m."user_id" = c."owner_id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "clubs" WHERE "manager_id" IS NULL) THEN
    RAISE EXCEPTION 'clubs senza manager dopo il backfill';
  END IF;
END $$;

ALTER TABLE "clubs" ALTER COLUMN "manager_id" SET NOT NULL;

ALTER TABLE "clubs" DROP CONSTRAINT "clubs_owner_id_fkey";
DROP INDEX "clubs_owner_id_idx";
ALTER TABLE "clubs" DROP COLUMN "owner_id";

CREATE INDEX "clubs_manager_id_idx" ON "clubs"("manager_id");
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_manager_id_fkey"
  FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


/* ---------- 5. BOOKING_PLAYERS: user_id -> player_id (resta nullable: ospiti) ---------- */
ALTER TABLE "booking_players" ADD COLUMN "player_id" UUID;

UPDATE "booking_players" bp
   SET "player_id" = p."id"
  FROM "players" p
 WHERE p."user_id" = bp."user_id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "booking_players"
     WHERE "user_id" IS NOT NULL AND "player_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'booking_players con user_id senza player corrispondente';
  END IF;
END $$;

ALTER TABLE "booking_players" DROP CONSTRAINT "booking_players_user_id_fkey";
DROP INDEX "booking_players_user_id_idx";
ALTER TABLE "booking_players" DROP COLUMN "user_id";

CREATE INDEX "booking_players_player_id_idx" ON "booking_players"("player_id");
ALTER TABLE "booking_players" ADD CONSTRAINT "booking_players_player_id_fkey"
  FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;


/* ---------- 6. USERS: via il ruolo ---------- */
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "user_role";


/* ---------- 7. ALTRE MODIFICHE ---------- */
ALTER TABLE "courts" ADD COLUMN "size" INTEGER NOT NULL DEFAULT 4;

COMMIT;