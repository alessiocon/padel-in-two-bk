## Why

Il dominio club non ha ancora una definizione persistente e verificabile dei dati di base per tenant, campi e disponibilità. Senza un modello chiaro del database, è difficile garantire isolamento multi-tenant, coerenza del calendario e capacità di estensione verso prenotazioni e gestione operativa.

## Goals

- definire i confini di persistenza per il tenant club
- modellare i campi come risorse indipendenti ma appartenenti a un solo club
- definire il calendario come vista derivata dalla disponibilità reale dei campi
- stabilire le tabelle e i vincoli minimi necessari per il supporto del dominio club

## Non-Goals

- non definire ancora utenti, prenotazioni, prezzi, pagamenti o relazioni con match
- non introdurre regole di business specifiche per il booking del giocatore
- non modellare la gestione avanzata del calendario in fase di prenotazione

## What Changes

- verranno definiti i modelli persistenti per `Club`, `Court` e `Calendar`
- verranno introdotte le tabelle relazionali con chiavi esterne, enum di stato e vincoli di integrità
- il calendario sarà trattato come proiezione derivata, non come fonte di verità indipendente
- la struttura sarà limitata al dominio club, senza includere prenotazioni o utenti

## Capabilities

### Modified Capabilities
- `clubs`: estensione del modello di dominio con persistenza dei club, dei campi e delle proiezioni di calendario

## Impact

- Database: nuove tabelle, relazioni e convalide di tenant isolation
- Backend: Prisma schema e servizi di lettura/scrittura per club e court
- API: contratti iniziali per query di disponibilità e gestione dei campi per singolo club
- Frontend: future UI per elenco club, dettagli campo e disponibilità per data/ora
- Multi-tenancy: ogni club vedrà solo i propri dati e la propria disponibilità
