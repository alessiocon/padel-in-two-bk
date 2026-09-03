## Context

Vedi `proposal.md` per la motivazione. Il backend espone oggi `POST /clubs` con il solo nome e il repository crea esclusivamente il record `Club`; i `Court` sono entita Prisma separate collegate tramite `clubId`. La nuova regola modifica il contratto di creazione e attraversa DTO, use case, repository, schema di risposta e test.

## Goals / Non-Goals

**Goals:**

- Rendere atomica la creazione di club e campi.
- Conservare il confine `Club` come proprietario dei `Court`.
- Restituire al chiamante una rappresentazione verificabile della capacita creata.
- Gestire in modo esplicito i dati storici eventualmente gia orfani.

**Non-Goals:**

- Non aggiungere CRUD autonomo dei campi.
- Non introdurre configurazioni individuali dei campi nel POST iniziale.
- Non cambiare booking, pagamenti, utenti o calendario oltre alla garanzia che ogni nuovo club abbia capacita.

## Decisions

### `courtCount` come input minimo

Il DTO `CreateClubDto` ricevera `courtCount` come intero positivo. Il client non inviera nomi o ID dei campi nella prima versione: il sistema generera nomi deterministici come `campo 1`, `campo 2`, fino al conteggio richiesto. Questo mantiene il contratto piccolo; un payload di campi completi sarebbe piu espressivo ma introdurrebbe validazione e gestione di duplicati non necessarie ora.

### Transazione nel repository

Il caso d'uso continuera a costruire il `Club`, mentre il repository eseguira `prisma.$transaction` con creazione del club e `createMany` dei campi. La transazione e preferibile a due chiamate separate per garantire rollback automatico se un inserimento fallisce. Il livello HTTP tradurra errori di validazione prima della transazione e gli errori di persistenza in risposte sicure.

La transazione dovra usare l'ID del club generato prima della creazione dei campi, assicurando che ogni `Court.clubId` riferisca il nuovo club. Il default operativo dei campi sara `AVAILABLE`.

### Contratto di risposta

La risposta di `POST /clubs` includera il club e `courtCount`, oppure una collezione di campi se il contratto esistente viene arricchito. La scelta raccomandata e restituire i campi generati con `id`, `clubId`, `name` e `status`, per consentire al frontend di confermare l'operazione senza una chiamata aggiuntiva; il numero resta derivabile dalla collezione.

### Invariante applicativa e dati esistenti

La foreign key `Court.clubId` garantisce ownership, ma PostgreSQL non puo imporre con una normale constraint che ogni `Club` abbia almeno una riga figlia. La garanzia primaria sara quindi nel command handler/repository transazionale. Prima del deploy bisognera verificare eventuali club storici senza campi: poiche non e definita una politica di cancellazione o creazione automatica di campi, la migration dovra almeno fallire chiaramente o produrre un report bloccante finche tali record non vengono sanati.

### Multi-tenant e compatibilita

Il `clubId` verra assegnato internamente e non sara accettato dal body come riferimento dei campi. Ogni campo creato usera esclusivamente l'ID del club appena persistito. Gli endpoint di lettura e aggiornamento del club restano invariati; i test esistenti che creano club senza `courtCount` dovranno essere aggiornati per il nuovo contratto.

### Impatto frontend e API

Il frontend dovra inviare `courtCount` nel flusso di onboarding e gestire HTTP `400` per conteggi invalidi. Questa change modifica solo il backend e il contratto OpenAPI; non include codice nel repository frontend. Swagger documentera `courtCount`, i campi generati e gli errori di validazione.

### Stripe

Nessun impatto: la creazione dei campi non crea account Stripe, pagamenti o dati finanziari.

## Risks / Trade-offs

- [Risk] La risposta con tutti i campi aumenta leggermente il payload. -> [Mitigation] Il numero iniziale dovrebbe essere contenuto; in futuro si potra restituire una proiezione compatta.
- [Risk] La generazione automatica dei nomi puo essere insufficiente per club con naming personalizzato. -> [Mitigation] Limitare questa decisione alla fase iniziale e introdurre un endpoint di gestione campi separato.
- [Risk] Club storici senza campi impediscono una garanzia retroattiva immediata. -> [Mitigation] Eseguire un audit pre-deploy e bloccare o sanare esplicitamente i record prima del rollout.
- [Risk] Un errore di persistenza dopo la creazione del club potrebbe lasciare dati parziali se si usano chiamate separate. -> [Mitigation] Rendere la transazione Prisma l'unico percorso di scrittura.
