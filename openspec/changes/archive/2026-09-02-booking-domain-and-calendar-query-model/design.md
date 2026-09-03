## Context

Vedi `proposal.md` per la motivazione. Il backend usa NestJS, TypeScript, Prisma e PostgreSQL in un modular monolith. Il dominio clubs persiste oggi `CalendarSlot`, anche se la disponibilita e gia concettualmente derivata; non esiste ancora un modulo booking.

## Goals / Non-Goals

**Goals:**

- Separare la root `Booking` dal modello di lettura del calendario.
- Usare PostgreSQL come protezione finale dell'invariante anti-overlap.
- Conservare i confini tenant tramite `clubId` e `courtId` coerenti.
- Esporre contratti REST e Swagger per query disponibilita e booking.
- Mantenere la durata fissa a 60 minuti e nessuna dipendenza da un cliente.

**Non-Goals:**

- Non modificare ancora `CourtStatus.reserved`.
- Non modellare utenti, clienti, pagamenti, cancellazioni, orari del club o timezone.
- Non introdurre durate configurabili o un motore di scheduling generale.

## Decisions

### Booking come modulo e domain root separati

Aggiungere un modulo Nest `bookings` con dominio, application services, repository Prisma e presentation layer. `Booking` possiede i propri invarianti; il club viene verificato tramite il repository del campo o una transazione applicativa. Un modulo interno a `clubs` manterrebbe responsabilita accoppiate e renderebbe piu difficile estendere il booking con pagamenti in futuro.

### Quattro stati espliciti

Il database e il dominio useranno gli enum `FREE`, `RESERVED`, `SEARCHING` e `BLOCKED`, mappati alle stringhe API `free`, `reserved`, `searching` e `blocked`. I booking `free` non occupano capacita; gli altri tre sono attivi ai fini dell'overlap. Non si introduce uno stato `cancelled`, perche il lifecycle avanzato e fuori scope.

### Durata fissa nel dominio

Il dominio calcolera `endsAt` aggiungendo una costante di 60 minuti a `startsAt`. L'API accettera solo `startsAt` e non permettera al client di scegliere una durata. Una costante nominata mantiene la decisione centralizzata senza introdurre configurazione prematura.

### Calendario come query model

Rimuovere `CalendarSlot` da Prisma e sostituire il calcolo con un query service che legge i campi del club e i booking non `free` i cui intervalli intersecano la finestra richiesta. Il risultato mantiene `isBookable`, `availableCourtCount`, `availableCourtIds` e `status` come DTO di lettura. Non viene scritto alcun record durante una query.

### Vincolo anti-overlap PostgreSQL

Usare un intervallo PostgreSQL derivato da `startsAt` e `endsAt` e un indice/constraint di esclusione su `courtId`, limitato agli stati non `free`. Il controllo applicativo produce un errore di dominio leggibile; il vincolo database protegge anche richieste concorrenti. Gli intervalli adiacenti sono validi perche l'overlap e definito con confronto strettamente minore/maggiore.

### API iniziali

Esporre:

- `GET /clubs/:clubId/availability?startsAt=...&endsAt=...` per il query model;
- `POST /clubs/:clubId/bookings` per creare una booking con `courtId`, `startsAt` e stato;
- `GET /clubs/:clubId/bookings/:id` per leggere una booking.

Non viene aggiunto per ora un endpoint di cancellazione o gestione cliente. Gli errori di intervallo, associazione e overlap saranno rispettivamente `400`, `400` e `409`.

### Impatto frontend

Non sono necessarie modifiche in questo repository frontend per completare il backend change. Il contratto OpenAPI deve pero descrivere i DTO in modo che il frontend possa consumare disponibilita e booking senza conoscere le tabelle sottostanti.

### Impatto Stripe

Nessuno: pagamenti e Stripe Connect restano fuori scope e non vengono aggiunti campi o dipendenze payment a `Booking`.

## Risks / Trade-offs

- [Risk] La durata di 60 minuti potrebbe non riflettere tutti i club. -> [Mitigation] Tenerla come costante isolata e pianificare la configurabilita come evoluzione successiva.
- [Risk] Lo stato `free` su una booking e semanticamente insolito. -> [Mitigation] Definirlo esplicitamente come booking non occupante e coprirlo con test di dominio e query model.
- [Risk] Il vincolo PostgreSQL sugli intervalli richiede una migration SQL specifica. -> [Mitigation] Verificare la migration su PostgreSQL/Neon e mantenere anche il controllo applicativo.
- [Risk] Mantenere `CourtStatus.reserved` puo duplicare temporaneamente il concetto di occupazione. -> [Mitigation] Non usare questo stato per il calcolo temporale del calendario; rimuoverlo in una change separata dopo migrazione e compatibilita.
- [Risk] Senza cliente non e possibile autorizzare ownership o notifiche. -> [Mitigation] Lasciare il booking anonimo e non introdurre comportamenti dipendenti dal player.

## Migration Plan

1. Aggiungere il modello `Booking`, i relativi enum, relazioni e indici.
2. Rimuovere modello, enum e tabella `CalendarSlot` dalla nuova migration.
3. Applicare il vincolo anti-overlap PostgreSQL per gli stati attivi.
4. Migrare il codice calendario da snapshot persistente a query service.
5. Pubblicare gli endpoint e aggiornare Swagger.
6. Verificare con test unitari, integrazione Prisma, API, build e lint.

La migration e distruttiva per `calendar_slots`, che non e ancora usata da booking o user data secondo la change precedente. Il rollback applicativo consiste nel ripristinare la versione precedente; il rollback database richiederebbe una migration compensativa e non deve essere eseguito automaticamente in produzione.
