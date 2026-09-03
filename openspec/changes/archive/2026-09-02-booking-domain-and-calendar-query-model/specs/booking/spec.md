## Purpose

Questa capability introduce prenotazioni temporali per i campi dei club, mantenendo il primo flusso indipendente da clienti, pagamenti e gestione avanzata degli orari.

## ADDED Requirements

### Requirement: Booking is a club-scoped domain root
Il sistema SHALL rappresentare ogni booking come una domain root autonoma associata a un solo club e a un solo campo.

#### Scenario: Valid club and court association
- **WHEN** viene creata una booking con un club e un campo
- **THEN** il sistema SHALL accettare l'operazione solo se il campo appartiene al club indicato

#### Scenario: Cross-club association rejected
- **WHEN** una booking riferisce un campo appartenente a un altro club
- **THEN** il sistema SHALL rifiutare l'operazione e SHALL non persistere la booking

### Requirement: Booking has exactly four states
Il sistema SHALL supportare esattamente gli stati `free`, `reserved`, `searching` e `blocked`, corrispondenti rispettivamente a libero, prenotato, in ricerca e bloccato.

#### Scenario: Supported booking state
- **WHEN** una booking viene creata o aggiornata con uno dei quattro stati supportati
- **THEN** il sistema SHALL accettare lo stato e restituirlo nel contratto della booking

#### Scenario: Unsupported booking state
- **WHEN** una richiesta contiene uno stato diverso dai quattro stati supportati
- **THEN** il sistema SHALL restituire un errore di validazione e SHALL non modificare la booking

### Requirement: Booking interval is fixed-duration
Il sistema SHALL creare ogni booking con una durata fissa di 60 minuti e SHALL derivare l'orario di fine dall'orario di inizio.

#### Scenario: Fixed duration
- **WHEN** viene richiesta una booking con un orario di inizio valido
- **THEN** il sistema SHALL impostare `endsAt` a 60 minuti dopo `startsAt`

#### Scenario: Client cannot choose duration
- **WHEN** una richiesta specifica una durata o un `endsAt` incompatibile con la durata fissa
- **THEN** il sistema SHALL rifiutare la richiesta con un errore di validazione

### Requirement: Booking validates temporal invariants
Il sistema SHALL rifiutare intervalli non validi e SHALL richiedere un orario di inizio interpretabile come data valida.

#### Scenario: Invalid start time
- **WHEN** viene richiesta una booking senza un orario di inizio valido
- **THEN** il sistema SHALL restituire un errore di validazione e SHALL non persistere la booking

#### Scenario: End precedes start
- **WHEN** una booking prodotta dal sistema avrebbe `endsAt` uguale o precedente a `startsAt`
- **THEN** il sistema SHALL rifiutare l'operazione

### Requirement: Active bookings cannot overlap
Il sistema SHALL impedire la sovrapposizione temporale tra booking non `free` dello stesso campo, considerando sovrapposti gli intervalli quando `new.startsAt < existing.endsAt` e `new.endsAt > existing.startsAt`.

#### Scenario: Overlapping active booking
- **WHEN** viene creata una booking non `free` che interseca una booking non `free` esistente dello stesso campo
- **THEN** il sistema SHALL rifiutare la nuova booking con un conflitto e SHALL preservare quella esistente

#### Scenario: Adjacent bookings
- **WHEN** una nuova booking inizia esattamente quando termina una booking esistente
- **THEN** il sistema SHALL consentire la nuova booking

#### Scenario: Free booking does not reserve capacity
- **WHEN** una booking ha stato `free`
- **THEN** il sistema SHALL escluderla dal calcolo dei conflitti e dalla capacità occupata

### Requirement: Booking has no customer dependency
Il sistema SHALL consentire la gestione iniziale delle booking senza richiedere un'entità cliente, player o utente.

#### Scenario: Booking without customer
- **WHEN** viene creata una booking valida
- **THEN** il sistema SHALL poterla persistere senza `customerId`, `playerId` o riferimento equivalente

### Requirement: Booking lifecycle remains minimal
Il sistema SHALL limitare la prima versione alle operazioni e agli stati necessari per rappresentare la prenotazione, senza introdurre pagamenti, cancellazioni, rimborsi, orari di apertura o timezone di club.

#### Scenario: Out-of-scope workflow
- **WHEN** una richiesta tenta di applicare un workflow di pagamento, rimborso o gestione avanzata degli orari
- **THEN** tale workflow SHALL remain outside questa capability e SHALL non essere richiesto per creare una booking
