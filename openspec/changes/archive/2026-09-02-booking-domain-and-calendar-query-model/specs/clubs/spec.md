## MODIFIED Requirements

### Requirement: Calendar availability is derived
The system SHALL compute calendar availability as a derived read model from the operational state of a club's courts and its non-free bookings rather than as a separately persisted source of truth.

#### Scenario: Aggregated capacity
- **WHEN** a club calendar evaluates a fixed time interval
- **THEN** the system SHALL return the number of operational courts without overlapping non-free bookings, the list of selectable courts, and whether the interval is bookable

#### Scenario: No available courts
- **WHEN** the club has zero operational courts without an overlapping non-free booking in the requested interval
- **THEN** the system SHALL mark the interval as unavailable and SHALL return no selectable court

### Requirement: Calendar data is club-scoped
The system SHALL ensure that all calendar query responses are scoped to the owning club and contain only that club's courts and booking-derived availability decisions.

#### Scenario: Club local view
- **WHEN** a caller requests availability for a club and a fixed time interval
- **THEN** the system SHALL return only courts belonging to that club and SHALL consider only bookings belonging to that club's courts

### Requirement: Persistence of club domain entities
The system SHALL persist core club entities and court operational state in dedicated relational tables; calendar availability SHALL NOT require a persisted calendar row.

#### Scenario: Club record creation
- **WHEN** a new club is created
- **THEN** the system SHALL store a unique club record with an identifier, business name, status, and creation metadata

#### Scenario: Court ownership
- **WHEN** a court is created for a club
- **THEN** the system SHALL attach it to exactly one club through a foreign key relationship and SHALL prevent cross-club ownership

#### Scenario: Calendar projection scope
- **WHEN** availability is queried for a club
- **THEN** the system SHALL calculate and return a tenant-scoped result without reading or writing a persisted calendar slot

### Requirement: Calendar is a derived availability view
The system SHALL expose calendar availability as a query-oriented projection based on courts and non-free bookings, not as an independently persisted entity.

#### Scenario: Derived availability
- **WHEN** the system calculates availability for a fixed time window
- **THEN** it SHALL count operational courts without overlapping non-free bookings, expose selected court IDs, and set the slot as bookable only when at least one court is available

#### Scenario: No available courts
- **WHEN** zero courts are available for a club in the requested interval
- **THEN** the system SHALL return a non-bookable calendar state and SHALL not expose selectable court IDs

### Requirement: Database constraints protect club isolation
The system SHALL enforce club-scoped data relationships and availability rules so that each club only accesses its own courts, bookings, and calendar output.

#### Scenario: Foreign key isolation
- **WHEN** a booking or other record references a court
- **THEN** the system SHALL enforce a valid club association and SHALL reject records that violate the club ownership boundary

#### Scenario: Bookability threshold
- **WHEN** a time window is evaluated
- **THEN** the system SHALL mark it as bookable only if the available court count is greater than zero
