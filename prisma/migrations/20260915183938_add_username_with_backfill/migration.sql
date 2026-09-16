/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- 1. Aggiungi la colonna consentendo momentaneamente valori NULL
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(50);

-- 2. Valorizza (Backfill) gli utenti esistenti (es. usando la parte iniziale dell'email o l'id)
UPDATE "users" 
SET "username" = COALESCE(
  SPLIT_PART("email", '@', 1) || '_' || SUBSTRING("id"::text FROM 1 FOR 4),
  'user_' || SUBSTRING("id"::text FROM 1 FOR 8)
)
WHERE "username" IS NULL;

-- 3. Imposta il vincolo NOT NULL (Ora che tutti i record hanno un valore)
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- 4. Aggiungi l'indice di unicità
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
