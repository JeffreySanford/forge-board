# ForgeBoard: Frontend-API Architecture Documentation
*Last Updated: May 15, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Architecture:</strong> Local-First ✅
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Data Provenance:</strong> Complete Lifecycle 🔄
  </div>
  <div style="background-color: #F9C74F; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Pattern:</strong> ProvenanceStore 📊
  </div>
  <div style="background-color: #90BE6D; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> Production-Ready 🚀
  </div>
</div>

## Architecture Overview

ForgeBoard implements a modern, reactive architecture with comprehensive data provenance tracking:

```mermaid
flowchart LR
  subgraph Backend [Backend]
    direction TB
    BE[Data Sources]
    PROV[Provenance Service]
  end
  subgraph Gateway [Gateway Layer]
    direction TB
    GW[Socket.IO Server]
    REST[REST API]
    PROVGW[Provenance Gateway]
  end
  subgraph Frontend [Angular Frontend]
    direction TB
    PRSVC[Provenance Service]
    AS[Angular Services]
    AC[Angular Components]
    PV[Provenance Viewer]
  end

  BE -->|"Data with Origin"| PROV
  PROV -->|"Verifiable Data"| GW
  PROV -->|"Provenance API"| REST
  PROV -->|"Provenance Events"| PROVGW
  
  GW -->|"Data Streams"| AS
  REST -->|"REST Calls"| AS
  PROVGW -->|"Provenance Events"| PRSVC
  
  AS -->|"Data with Provenance"| AC
  PRSVC -->|"Provenance Chain"| PV
  PV -->|"Visualize"| AC

  style BE fill:#FFDDC1,stroke:#E67E22,stroke-width:2px
  style PROV fill:#B22234,stroke:#7D100E,stroke-width:2px,color:#fff
  style GW fill:#D1E8E4,stroke:#16A085,stroke-width:2px
  style REST fill:#D1E8E4,stroke:#16A085,stroke-width:2px
  style PROVGW fill:#B22234,stroke:#7D100E,stroke-width:2px,color:#fff
  style AS fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px
  style AC fill:#D1F5FF,stroke:#0288D1,stroke-width:2px
  style PRSVC fill:#002868,stroke:#071442,stroke-width:2px,color:#fff
  style PV fill:#002868,stroke:#071442,stroke-width:2px,color:#fff
```

## Key Components

- **ProvenanceService**: Tracks complete data lifecycle, maintains provenance chains, and ensures cryptographic verification
- **MetricsService**: Manages real-time system metrics with provenance tracking for data origin and transformations
- **KablanService**: Handles Kanban board state via WebSockets, supports optimistic updates with full provenance history
- **DiagnosticsService**: Tracks health data with source provenance for verification and compliance evidence
- **LoggerService**: Collects, filters, and exports logs in real time with data provenance for each event
- **BackendStatusService**: Monitors gateway states with provenance tracking for connection events

### Data Provenance Architecture

ForgeBoard implements a comprehensive data provenance system that tracks the complete data lifecycle:

```mermaid
sequenceDiagram
  participant UI as Component
  participant PS as ProvenanceService
  participant SVC as DataService
  participant SRV as Backend
  
  Note over UI,SRV: Data Inception
  UI->>PS: createProvenanceRecord(data, metadata)
  PS->>PS: signInceptionRecord()
  PS->>UI: inceptionRecord
  
  Note over UI,SRV: Query External Source
  UI->>SVC: fetchData(params)
  SVC->>PS: transitionStage(inceptionRecord, 'query')
  PS->>PS: signQueryRecord()
  PS->>PS: storeProvenance()
  SVC->>SRV: HTTP/Socket Request
  SRV->>SVC: Response with Provenance
  
  Note over UI,SRV: Receive & Verify
  SVC->>PS: transitionStage(queryRecord, 'response')
  PS->>PS: verifySourceSignature()
  PS->>PS: signResponseRecord()
  SVC->>UI: verified data
  
  Note over UI,SRV: Process & Store
  UI->>PS: transitionStage(responseRecord, 'storage')
  PS->>PS: persistToBlockchain()
  PS->>UI: storageRecord + receipt
```

### Socket Connection Management with Provenance

Socket connections maintain complete data provenance for real-time streams:

```mermaid
sequenceDiagram
  participant C as Component
  participant S as Service
  participant P as ProvenanceService
  participant G as Gateway
  participant B as Backend

  Note over C,B: Connection with Provenance
  C->>S: initSocket()
  S->>P: recordConnectionAttempt(context)
  S->>G: connect(namespace, provenanceContext)
  G-->>S: connect_ack + serverProvenance
  P->>P: verifyServerProvenance()
  S->>S: next(dataSubject)
  S-->>C: Observable emits with provenance

  Note over S: on error -> fallback with provenance
  G-->>S: connection_error
  S->>P: recordConnectionFailure(error)
  S->>S: startMockDataGeneration(provenanceContext)
  S-->>C: mock data stream with mock provenance

  Note over S: reconnect when backend available
  S->>B: GET /status
  B-->>S: {status: success, provenance: serverSignature}
  P->>P: verifyServerSignature()
  S->>G: reconnect(forceNew, provenanceContext)
```

## Module Structure

### Metrics Module with Data Provenance

Provides real-time system performance monitoring with complete data provenance:

- Live metric charts with cryptographically verifiable data origin
- Origin attestation for all metrics data from external providers
- Signature verification for all metric sources
- Provenance-aware visualization with source highlighting

### Kablan Board Module with Task Provenance

Implements a Kanban-style project management system with task provenance tracking:

- Complete history of all task transitions with actor attribution
- Cryptographic verification of task update authority
- Task ownership provenance with delegation tracking
- Immutable audit trail of all board changes

### Diagnostics Module with System Provenance

Offers comprehensive system monitoring tools with complete provenance tracking:

- Health timeline with cryptographically verifiable state transitions
- Socket connection metrics with verified endpoint attestations
- Event logging with tamper-evident provenance chain
- Status indicators with verification status visualization

### Logger Module with Log Provenance

Provides detailed logging functionality with complete log provenance:

- Source attribution for all log entries with cryptographic verification
- Log chain integrity verification with tamper detection
- Event correlation with provenance linking
- Export capabilities with verifiable log bundles

## Data Flow Patterns

### Provenance Service Pattern

```mermaid
flowchart TD
  subgraph Backend [Backend]
    direction TB
    BE[Socket.IO Gateway]:::backend
    BH[HTTP Controller]:::backend
    BP[Provenance Service]:::provenance
  end
  subgraph ServiceLayer [Angular Service Layer]
    direction TB
    S1[BehaviorSubject/Subject]:::service
    S2[Public Observable API]:::service
    PS[Provenance Service]:::provenance
  end
  subgraph ComponentLayer [Component Layer]
    direction TB
    C1[Subscribe to Observables]:::component
    C2[Update UI State]:::component
    PV[Provenance Viewer]:::provenance
  end

  BE -- "Data + Provenance" --> S1
  BH -- "Data + Provenance" --> S1
  BP -- "Provenance Chain" --> PS
  
  S1 -- "next()" --> S2
  S2 -- "subscribe()" --> C1
  PS -- "Provenance Chain" --> PV
  
  C1 --> C2
  PV --> C2

  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef provenance fill:#002868,stroke:#071442,stroke-width:2px,color:#FFFFFF;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
  classDef component fill:#D1F5FF,stroke:#0288D1,stroke-width:2px;
```

**Explanation:**
- The backend emits events with source provenance metadata
- The Angular service layer receives data and verifies provenance
- Components subscribe to data with verified provenance chains
- The Provenance Viewer provides visualization of data lineage

### Provenance-Aware Mock Data & Reconnection Strategy

```mermaid
flowchart TD
  CF[Connection Failure]:::error --> ED[Error Detection]:::error --> MD[Mock Data Generation\nwith Mock Provenance]:::mock
  MD --> SI[Status Indicator\nwith Provenance]:::status
  SI --> RL[Reconnection Logic]:::reconnect
  RL --> BC[Backend Connection]:::backend
  BC -- "success + provenance" --> SVC[Service Layer]:::service
  RL -- "fail + record failure" --> MD

  classDef error fill:#FFCDD2,stroke:#C62828,stroke-width:2px;
  classDef mock fill:#FFF9C4,stroke:#FBC02D,stroke-width:2px;
  classDef status fill:#E1F5FE,stroke:#0288D1,stroke-width:2px;
  classDef reconnect fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
```

**Explanation:**
- On connection failure, the service detects the error and starts mock data generation with mock provenance
- Mock data is clearly identified in the provenance chain as simulated data
- Reconnection logic periodically checks backend availability with provenance verification
- On successful reconnection with verified server provenance, the service resumes real data

## Provenance-First Development Principles

1. **Complete Data Lifecycle Tracking**: Every piece of data must have a tracked lifecycle from inception to disposal
2. **Verifiable Source Attribution**: All data must have cryptographically verifiable source information
3. **Immutable Transition Records**: Every data state change must be recorded with attribution and purpose
4. **Cryptographic Verification**: All data transitions must be cryptographically signed and verified
5. **Transparent Processing**: All transformations must be recorded with justification and attribution
6. **Purpose Binding**: Every data request must have a documented and verifiable purpose
7. **Chain of Custody**: Complete visibility into who accessed data and when

---

**Legend:**
- 🔵 **Data Provenance** - Complete tracking of data from inception through disposal
- 🔴 **Cryptographic Verification** - Tamper-evident guarantees through digital signatures
- 🟡 **Local-First Authority** - Device maintains authoritative provenance records
- 🟢 **Privacy-Preserving Verification** - Zero-knowledge proofs for selective disclosure

