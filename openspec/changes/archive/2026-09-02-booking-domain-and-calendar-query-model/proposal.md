## Why

Il calendario persistito oggi mescola dati derivati e stato operativo dei campi, mentre non esiste ancora un modello per rappresentare prenotazioni temporali. Introdurre una domain root `Booking` consente di calcolare la disponibilita come query model e di proteggere l'invariante fondamentale che impedisce la sovrapposizione di prenotazioni sullo stesso campo.

## Goals

- Rappresentare le prenotazioni come capability indipendente e isolata per club.
- Calcolare la disponibilita leggendo campi e prenotazioni attive.
- Rendere verificabile e persistente l'invariante di non overlap.
- Mantenere il primo incremento minimale: durata fissa, nessuna entita cliente e nessuna gestione avanzata degli orari.

## Non-goals

- Non introdurre utenti, clienti, autenticazione o associazioni a un player.
- Non introdurre pagamenti, cancellazioni, rimborsi o workflow operativi avanzati.
- Non rimuovere per ora lo stato `reserved` da `CourtStatus`.
- Non modellare ancora orari di apertura, timezone o durate configurabili.

## What Changes

- **BREAKING** Rimuovere `CalendarSlot` e la tabella `calendar_slots`, che non saranno piu una fonte persistente di disponibilita.
- Aggiungere il dominio `Booking` come nuova aggregate/domain root con gli stati `free`, `reserved`, `searching` e `blocked`.
- Usare una durata fissa per le prenotazioni e validare intervalli coerenti.
- Calcolare il calendario tramite un query model derivato da campi e booking.
- Rifiutare prenotazioni attive sovrapposte sullo stesso campo, anche in presenza di richieste concorrenti.
- Mantenere i confini tenant: una booking puo riferire solo campo e club coerenti.

## Impatto su Players e Clubs

- I Players potranno ottenere una disponibilita coerente con le prenotazioni reali, senza vedere campi occupati come liberi.
- I Clubs manterranno i propri campi isolati e potranno essere rappresentati da prenotazioni indipendenti dal modello cliente.
- Le API di booking e disponibilita saranno nuove; il contratto CRUD dei club resta invariato.

## Capabilities

### New Capabilities

- `booking`: creazione e validazione di prenotazioni temporali per campo, con stati iniziali, durata fissa e vincolo di non overlap.

### Modified Capabilities

- `clubs`: il calendario diventa una vista di sola lettura derivata da campi e prenotazioni; `calendar_slots` non e piu una fonte persistente.

## Impact

- Backend: nuovo modulo `bookings`, query model del calendario e API REST documentate con Swagger.
- Database: rimozione di `CalendarSlot`, nuova tabella `bookings`, indici e vincolo PostgreSQL contro gli overlap attivi.
- Test: nuovi test di dominio, query model, persistenza, concorrenza logica e controller.
- Dipendenze: nessuna nuova dipendenza applicativa prevista.
