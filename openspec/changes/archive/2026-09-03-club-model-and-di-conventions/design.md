## Context

Vedi `proposal.md` per motivazione e perimetro. Il backend usa Prisma/PostgreSQL per Club, Court e Booking; il dominio Club contiene oggi email assente, timestamp su Court e contratti repository senza prefisso `I`. I use case clubs vengono registrati tramite una factory generica, mentre i booking use case usano gia token espliciti con `@Inject`.

## Goals / Non-Goals

**Goals:**

- Introdurre `Club.email` come dato obbligatorio, validato e univoco.
- Rimuovere i timestamp dal modello Prisma e dal dominio Court senza alterare Booking.
- Uniformare i contratti repository con prefisso `I` e token distinti.
- Rendere omogeneo il wiring Nest con classi `@Injectable()` e `@Inject(TOKEN)`.
- Mantenere API e isolamento tenant coerenti con le relazioni esistenti.

**Non-Goals:**

- Nessuna verifica email, invio notifiche o autenticazione del contatto.
- Nessun cambiamento ai timestamp di Club o Booking.
- Nessun cambiamento a stati, overlap o query model del calendario.
- Nessun nuovo modulo applicativo.

## Decisions

### Email Club

Aggiungere `email` a Club, DTO, dominio e tabella con formato email validato a livello API/dominio e indice unico PostgreSQL. Il valore sarà normalizzato con trim e lowercase prima della persistenza, così `Info@Club.it` e `info@club.it` non generano identità diverse. Un campo obbligatorio ma non univoco non soddisferebbe il requisito di contatto stabile e permetterebbe duplicazioni operative.

La migration dovrà gestire i record esistenti senza email prima di applicare `NOT NULL` e `UNIQUE`. Poiché non esiste una sorgente affidabile per inventare indirizzi, la strategia raccomandata è una migration bloccante/audit che fallisce con un elenco o conteggio degli orfani, da sanare manualmente prima del deploy.

### Court senza timestamp

Rimuovere `createdAt` e `updatedAt` da `Court` in Prisma, migration SQL, `ClubCourt`, mapping repository, DTO e fixture. I timestamp di Club restano invariati. Non modificare Booking, che conserva il proprio lifecycle temporale.

### Contratti repository con prefisso I

Rinominare `ClubRepository` in `IClubRepository` e `BookingRepository` in `IBookingRepository`, aggiornando implementazioni, test e import. I token runtime `CLUB_REPOSITORY` e `BOOKING_REPOSITORY` restano invariati: il prefisso riguarda il contratto TypeScript e non modifica la risoluzione Nest.

### Wiring Nest uniforme

Aggiungere `@Injectable()` a tutti i club use case e `@Inject(CLUB_REPOSITORY)` al parametro repository. Rimuovere la factory generica dal `ClubsModule` e registrare direttamente i cinque use case come provider. Questo rende il costruttore la fonte esplicita della dipendenza, come gia accade nei booking use case, e consente di aggiungere dipendenze specifiche senza modificare una factory condivisa.

### API e compatibilita

`POST /clubs` richiederà `email` oltre a `name` e `courtCount`; `PATCH /clubs/:id` potrà aggiornare l'email con la stessa validazione e unicità. `ClubResponseDto` esporrà l'email. Le risposte dei Court non esporranno timestamp. Gli errori di formato saranno `400`, i duplicati email `409`.

### Frontend e Stripe

Il frontend dovrà aggiungere email all'onboarding e gestire il conflitto `409`; questa change modifica solo il backend. Stripe non è coinvolto: l'email Club non crea né modifica account o pagamenti Stripe.

## Risks / Trade-offs

- [Risk] Dati Club esistenti senza email bloccano la migration. -> [Mitigation] Audit/migration esplicita e backfill manuale prima di applicare `NOT NULL` e `UNIQUE`.
- [Risk] La normalizzazione lowercase può cambiare il valore visualizzato. -> [Mitigation] Documentare che l'email è un identificatore normalizzato; il dominio conserva il valore canonico.
- [Risk] La rimozione dei timestamp Court rompe consumer che li leggono. -> [Mitigation] Aggiornare DTO, test e documentazione nello stesso change.
- [Risk] La rinomina delle interfacce può lasciare import residui. -> [Mitigation] Usare ricerca globale TypeScript, build e lint come gate.
- [Risk] Una factory rimossa può cambiare la registrazione provider. -> [Mitigation] Coprire bootstrap del modulo e test controller con TestingModule.
