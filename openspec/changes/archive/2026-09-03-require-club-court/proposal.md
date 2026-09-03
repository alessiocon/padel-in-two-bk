## Why

Un club senza almeno un campo non è utilizzabile dalla piattaforma: non può esporre disponibilità, ricevere prenotazioni o rappresentare un impianto reale. Il flusso attuale crea club orfani perché `POST /clubs` persiste solo il circolo e non richiede alcun campo associato.

## Goals

- Rendere obbligatorio un numero positivo di campi nella creazione di un club.
- Creare automaticamente i campi associandoli al nuovo `clubId`.
- Garantire atomicità: club e campi devono essere creati insieme oppure non deve essere persistito nulla.
- Impedire che il flusso applicativo produca nuovi club senza campi.
- Mantenere l'isolamento multi-tenant tra club e campi.

## Non-goals

- Non introdurre gestione completa dei campi, come modifica, eliminazione o riordino.
- Non introdurre configurazione individuale dei campi nel payload iniziale oltre al conteggio richiesto.
- Non modificare il modello Booking o il query model del calendario oltre all'impatto necessario per avere club utilizzabili.
- Non introdurre utenti, clienti, pagamenti o autorizzazioni amministrative.
- Non rimuovere lo stato `reserved` da `CourtStatus`.

## What Changes

- **BREAKING** Aggiornare `POST /clubs` per richiedere `courtCount`, intero positivo maggiore di zero.
- Creare `courtCount` campi durante la creazione del club, ciascuno con un identificatore univoco, stato operativo predefinito, nome generato (`campo 1`, `campo 2`, ...) e riferimento al club appena creato.
- Eseguire la creazione del club e dei campi in una singola transazione.
- Effettuare rollback dell'intera operazione se la creazione del club o di uno dei campi fallisce.
- Aggiornare la risposta del club per esporre almeno il numero dei campi creati e, se previsto dal contratto scelto, i campi generati.
- Rifiutare richieste con `courtCount` mancante, zero, negativo, non intero o non numerico.
- Verificare i dati esistenti e definire la gestione dei club già orfani prima di dichiarare l'invariante valida sull'intero database.

## Impatto su Players e Clubs

- I Players vedranno solo club creati con capacità sportiva minima e quindi utilizzabili per disponibilità e prenotazioni.
- I Clubs dovranno fornire il numero iniziale di campi durante l'onboarding; un errore non lascerà un record parzialmente creato.
- Il contratto di creazione club cambia; gli endpoint di lettura, aggiornamento e cancellazione restano invariati salvo l'eventuale arricchimento della rappresentazione con i campi.

## Capabilities

### New Capabilities

<!-- Nessuna nuova capability: il comportamento appartiene al dominio clubs esistente. -->

### Modified Capabilities

- `clubs`: la creazione di un club richiede e crea almeno un campo associato atomically, impedendo nuovi club orfani.

## Impact

- Backend: DTO, use case, aggregate/application boundary e repository della creazione club.
- Database: creazione coordinata di `Club` e `Court`; possibile migrazione o audit dei club già privi di campi.
- API: aggiornamento di Swagger, validazione e test del `POST /clubs`.
- Test: casi di conteggio valido, input invalido, rollback e isolamento del `clubId`.
- Frontend: il client dovrà inviare `courtCount` durante l'onboarding; nessuna implementazione frontend è inclusa in questa change backend.
