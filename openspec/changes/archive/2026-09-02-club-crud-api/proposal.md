## Why

Il dominio dei circoli dispone già dei modelli persistenti, ma non espone ancora un ingresso applicativo per gestire il tenant root. Una prima API REST per i club permette di verificare il flusso completo NestJS/DDD/persistenza e fornisce la base per le future API di campi, calendari e prenotazioni.

## Goals

- esporre un CRUD REST funzionante per i circoli
- mantenere il circolo come aggregate root del dominio
- separare dominio, casi d'uso applicativi, infrastruttura Prisma e trasporto HTTP
- validare gli input e restituire errori HTTP coerenti
- preservare l'isolamento dei dati del circolo

## Non-Goals

- non aggiungere endpoint per campi, calendari, disponibilità o prenotazioni
- non introdurre autenticazione, autorizzazione o gestione degli utenti in questa fase
- non modificare il modello di dominio dei campi o del calendario
- non introdurre gestione di pagamenti, Stripe o match

## What Changes

- aggiunge l'API REST `GET /clubs`
- aggiunge l'API REST `GET /clubs/:id`
- aggiunge l'API REST `POST /clubs`
- aggiunge l'API REST `PATCH /clubs/:id`
- aggiunge l'API REST `DELETE /clubs/:id`
- aggiunge DTO, validazione, mapping delle risposte e gestione degli errori
- introduce un modulo NestJS organizzato secondo i confini DDD del dominio club
- collega i casi d'uso del dominio al repository Prisma già configurato
- documenta gli endpoint tramite Swagger/OpenAPI

## Capabilities

### New Capabilities
- `club-crud-api`: gestione REST dei circoli come aggregate root tramite operazioni di lettura, creazione, aggiornamento e cancellazione

### Modified Capabilities

## Impact

- Backend: nuovo modulo `clubs` con dominio, application layer, infrastruttura e controller HTTP
- Database: utilizzo della tabella `clubs` esistente, senza nuove entità in questa fase
- API: nuovo contratto REST per i circoli con risposte JSON e status code standard
- Frontend: futura integrazione per amministrazione e consultazione dei circoli; nessuna modifica frontend in questo repository
- Players: potranno essere serviti in futuro da un elenco di circoli, senza gestione delle prenotazioni in questa change
- Clubs: potranno essere creati e gestiti attraverso il backend
- Multi-tenancy: ogni accesso al circolo dovrà usare l'identificativo del circolo come confine di aggregazione; l'autorizzazione resta fuori scope e sarà aggiunta con il dominio utenti
