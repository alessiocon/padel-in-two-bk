## Why

Il modello Club/Court contiene metadati non necessari per il dominio attuale e manca un contatto identificativo del circolo. Inoltre, le convenzioni tra i moduli clubs e bookings sono incoerenti: alcune dipendenze usano factory Nest, altre token `@Inject`, e le interfacce non sono immediatamente riconoscibili come contratti.

## Goals

- Rendere `Club.email` obbligatoria e univoca.
- Rimuovere da `Court` i timestamp di creazione e aggiornamento non usati dal dominio.
- Uniformare il naming delle interfacce con il prefisso `I`.
- Uniformare l'injection Nest usando `@Injectable()` e `@Inject(TOKEN)` nei casi d'uso.
- Conservare i confini DDD e la sostituibilità dei repository.

## Non-goals

- Non modificare la logica di booking, overlap o disponibilità.
- Non introdurre autenticazione, verifica email, utenti o notifiche.
- Non cambiare lo status dei club o dei campi.
- Non modificare il flusso di generazione dei campi introdotto dalla change `require-club-court`.

## What Changes

- **BREAKING** Aggiungere `email` obbligatoria al modello Club, al dominio e al contratto `POST /clubs`.
- Rendere `Club.email` univoca nel database e restituirla nelle rappresentazioni API.
- **BREAKING** Rimuovere `createdAt` e `updatedAt` dal modello persistente `Court` e dai relativi mapping/test.
- Rinominare le interfacce di repository con prefisso `I`, inclusi `IClubRepository` e `IBookingRepository`, aggiornando tutti gli import e le implementazioni.
- Aggiungere `@Injectable()` agli use case dei club e usare `@Inject(CLUB_REPOSITORY)` esplicitamente.
- Rimuovere la factory generica dei club dal modulo Nest e registrare direttamente i provider dei use case.
- Adottare la stessa convenzione esplicita per nuove dipendenze applicative future.
- Creare una migration per i dati esistenti: l'email richiede una strategia di valorizzazione o blocco prima di applicare `NOT NULL` e `UNIQUE`.

## Impatto su Players e Clubs

- I Clubs dovranno fornire un indirizzo email univoco durante creazione e onboarding.
- I Players potranno ricevere una rappresentazione del club con un contatto stabile, senza variazioni al flusso di prenotazione.
- Le risposte API cambieranno per includere email e non includeranno metadati Court rimossi.

## Capabilities

### New Capabilities

<!-- Nessuna nuova capability: il cambiamento aggiorna il dominio clubs e le convenzioni interne. -->

### Modified Capabilities

- `clubs`: email obbligatoria/univoca per Club e rimozione dei timestamp Court.

## Impact

- Backend: dominio Club, modello Prisma, migration, DTO, controller, repository e use case.
- API: payload `POST /clubs`, risposta Club e documentazione Swagger.
- Database: colonna `clubs.email` obbligatoria/univoca e rimozione dei timestamp da `courts`.
- Architettura: rinomina dei contratti repository e uniformazione dei provider Nest.
- Test: aggiornamento di unit, controller, integration e test di compilazione.
