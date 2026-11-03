
-- 1. Rimuovi temporaneamente o gestisci i vincoli esistenti se necessario
-- (Prisma genera già i DROP delle vecchie foreign key verso users)

-- DropForeignKey
ALTER TABLE "tournament_teams" DROP CONSTRAINT "tournament_teams_player1_id_fkey";
ALTER TABLE "tournament_teams" DROP CONSTRAINT "tournament_teams_player2_id_fkey";

-- 2. Rimuovi la colonna is_platform_admin se non ti serve più (o lasciala se l'hai reintrodotta)
ALTER TABLE "users" DROP COLUMN "is_platform_admin";

-- =========================================================================
-- 3. STEP FONDAMENTALE: BACKFILL DEI PLAYER 1 E PLAYER 2 NEI TORNEI
-- =========================================================================

-- Aggiorna player1_id puntando all'ID della tabella "players" basandosi sul vecchio user_id
UPDATE "tournament_teams" tt
   SET "player1_id" = p."id"
  FROM "players" p
 WHERE p."user_id" = tt."player1_id";

-- Fai la stessa cosa per player2_id (che essendo nullable potrebbe essere null o puntare a un user)
UPDATE "tournament_teams" tt
   SET "player2_id" = p."id"
  FROM "players" p
 WHERE tt."player2_id" IS NOT NULL 
   AND p."user_id" = tt."player2_id";


-- =========================================================================
-- 4. APPLICAZIONE DELLE NUOVE FOREIGN KEY VERSO LA TABELLA "PLAYERS"
-- =========================================================================

-- AddForeignKey (Player 1 ora punta a players.id ed è obbligatorio NOT NULL)
ALTER TABLE "tournament_teams" 
  ADD CONSTRAINT "tournament_teams_player1_id_fkey" 
  FOREIGN KEY ("player1_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (Player 2 ora punta a players.id ed è nullable)
ALTER TABLE "tournament_teams" 
  ADD CONSTRAINT "tournament_teams_player2_id_fkey" 
  FOREIGN KEY ("player2_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;