# 👨‍💻 ForgeBoard NX Coding Standards

*Last Updated: May 15, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Code:</strong> TypeScript ✨
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Architecture:</strong> Local-First 🏠
  </div>
  <div style="background-color: #F9C74F; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Standard:</strong> SonarQube A+ 🥇
  </div>
  <div style="background-color: #90BE6D; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Data Provenance:</strong> Complete 🔄
  </div>
</div>

## Data Provenance Patterns

### Complete Lifecycle Tracking

```mermaid
flowchart TD
  Origin[Data Origin Point]:::inception --> Query[External Query]
  Query --> Response[Data Response]
  Response --> Verify[Data Verification]
  Verify --> Store[Data Storage]
  Store --> Process[Data Processing]
  Process --> Sync[Optional Sync]
  Sync --> Dispose[Verified Disposal]
  
  classDef inception fill:#002868,stroke:#071442,color:#fff,stroke-width:2px;
  classDef disposal fill:#BF0A30,stroke:#7D100E,color:#fff,stroke-width:2px;
```

- **Data Provenance Principle**: Every data element must have a complete, verifiable lifecycle
- **Lifecycle Transitions**: All state changes must include provenance metadata
- **Verification Requirements**: Every data transition must be cryptographically verifiable
- **Attribution**: All data operations must have clear, non-repudiable attribution

### Required Provenance Operators

- **`trackProvenance$()`**: Capture complete data provenance for all data operations
- **`verifyProvenance$()`**: Verify the integrity of provenance chains
- **`transitionStage$()`**: Move data to next lifecycle stage with appropriate metadata
- **`generateProvenanceReport$()`**: Create audit-ready provenance documentation

## Local-First Architecture

### ProvenanceStore & Data Authority

```mermaid
flowchart TD
  Component[Component]:::component -->|"State Action with Provenance"| Store[ProvenanceStore]:::store
  Store -->|"trackProvenance$()"| Chain[SlimChain]:::chain
  Store -->|"select()"| Stream[State Stream with Provenance]:::state
  Stream -->|"subscribe()"| Component
  Chain -->|"provenanceReceipt$"| Store
  
  classDef component fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef store fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
  classDef chain fill:#BF0A30,stroke:#7D100E,stroke-width:2px,color:#FFFFFF;
  classDef state fill:#90BE6D,stroke:#2980B9,stroke-width:2px;
```

- **Local-First Principle**: Device is the source of authority (SOA) for all data
- **Store Pattern**: Use ProvenanceStore for immutable state with complete provenance history
- **Blockchain Integration**: Persist provenance chains to SlimChain for verification
- **Provenance Requirements**: All state transitions must include complete provenance metadata

---

## WebRTC Mesh & Fallback Patterns

### Data Flow: Peer-to-Peer First

```mermaid
flowchart LR
  Device1[Device 1]:::device --> |"WebRTC"| Device2[Device 2]:::device
  Device1 -.->|"Fallback WebSocket"| Server[Sync Server]:::server
  Server -.->|"Fallback WebSocket"| Device2
  
  classDef device fill:#002868,stroke:#BF0A30,stroke-width:3px,color:#FFFFFF;
  classDef server fill:#CCCCCC,stroke:#666666,stroke-width:1px;
```

- **Prefer P2P**: Always attempt WebRTC direct connection first
- **Fallback Strategy**: Use server relay only when direct connection fails
- **Offline Operation**: All features must work without any network connection

### Sovereignty-First Connection Strategy

```mermaid
flowchart TD
  Connection[Connection Service]:::service --> |"isP2PAvailable()"| P2PCheck{P2P Available?}
  P2PCheck -->|Yes| P2PConnect[Use P2P Mesh]:::primary
  P2PCheck -->|No| ServerCheck{Server Available?}
  ServerCheck -->|Yes| ServerConnect[Use Server Relay]:::secondary
  ServerCheck -->|No| Offline[Operate Offline]:::offline
  P2PConnect --> Stream[Data Stream]
  ServerConnect --> Stream
  Offline --> Stream
  
  classDef service fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
  classDef primary fill:#90BE6D,stroke:#43A047,stroke-width:2px;
  classDef secondary fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef offline fill:#BF0A30,stroke:#7D100E,stroke-width:2px,color:#FFFFFF;
```

---

## Blockchain Persistence Patterns

### SlimChain Integration for Provenance

```mermaid
flowchart TD
  Service[Service]:::service -->|"dataWithProvenance$"| Store[ProvenanceStore]:::store
  Store -->|"provenance tracking"| MergedState[Provenance Chain]:::state
  MergedState -->|"trackProvenance$()"| Chain[SlimChain]:::chain
  Chain -->|"append provenance block"| Ledger[(Immutable Provenance)]:::ledger
  Ledger -->|"provenanceReceipt$"| Store
  
  classDef service fill:#90BE6D,stroke:#43A047,stroke-width:2px;
  classDef store fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
  classDef state fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef chain fill:#BF0A30,stroke:#7D100E,stroke-width:2px,color:#FFFFFF;
  classDef ledger fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
```

### Required Provenance Operators

- **`trackProvenance$()`**: Capture and verify data origin, transitions, and handling
- **`verifyProvenanceChain$()`**: Verify complete data lineage against blockchain records
- **`provenanceMerkleProof$()`**: Generate cryptographic proof for provenance validation
- **`provenanceRetention$()`**: Apply configurable retention policies with disposal verification

### Storage Efficiency Guidelines

1. **Provenance Delta Compression**: Only store provenance transitions, not full state
2. **Pruning Strategy**: Implement configurable lifecycle-based pruning
3. **Zstd Compression**: Apply level 3 compression to all provenance data
4. **Retention Policies**: Default to 512 MB maximum local provenance storage

---

## CRDT Synchronization Patterns

### Conflict Resolution with Provenance Preservation

```mermaid
flowchart LR
  DeviceA[Device A]:::device -->|"Change with\nProvenance"| Merge[CRDT Merge with\nProvenance Preservation]:::merge
  DeviceB[Device B]:::device -->|"Change with\nProvenance"| Merge
  Merge -->|"Deterministic Result\nwith Merged Provenance"| FinalState[Final State\nwith Complete Provenance]:::state
  FinalState -->|"trackProvenance$()"| Chain[SlimChain]:::chain
  
  classDef device fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
  classDef merge fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef state fill:#90BE6D,stroke:#43A047,stroke-width:2px;
  classDef chain fill:#BF0A30,stroke:#7D100E,stroke-width:2px,color:#FFFFFF;
```

### Required CRDT Types

| Data Type | CRDT Implementation | Use Case |
|-----------|---------------------|----------|
| Text | Yjs Text | Collaborative text fields |
| Maps | Yjs Map | Object properties, settings |
| Arrays | Yjs Array | Lists, collections |
| Counters | Yjs Number | Metrics, statistics |
| Custom | Custom CRDT | Domain-specific types |

---

## RxJS Guidelines

- Always clean up subscriptions (`ngOnDestroy`, `takeUntil`).
- Use `catchError`, `retry`, and `finalize` for robust error handling.
- Prefer `BehaviorSubject` for state with a current value, `Subject` for event streams.

---

## CSS/SCSS Standards

- **BEM-inspired naming** for all classes.
- **Color variables** for consistency and theme support.
- **Mobile-first** responsive design.

---

## Testing Guidelines

- **Component tests**: Use Angular TestBed, mock services, and DOM queries.
- **Service tests**: Use HttpClientTestingModule, test Observables and error handling.
- **E2E tests**: Use Playwright or Cypress for real user flows.

---

## Documentation & Git Workflow

- All public classes, interfaces, and services must have JSDoc comments.
- Use clear, descriptive commit messages:
  - `feat(scope): Add new feature`
  - `fix(scope): Fix bug`
  - `docs(scope): Update documentation`
- Branch naming: `feature/`, `bugfix/`, `chore/` prefixes.

---

## Summary Diagram: Data Provenance Flow

```mermaid
flowchart LR
  FE[Frontend Component]:::component --> SVC[Provenance Service]:::service
  SVC -->|"trackProvenance$()"| CHAIN[SlimChain]:::chain
  SVC -.->|"Optional Provenance-Preserving Sync"| P2P[WebRTC Mesh]:::p2p
  SVC -.->|"Optional Fallback"| WS[WebSocket Gateway]:::backend
  P2P -.->|"Mesh Network"| P2P
  WS -.->|"Sync Only"| DB[(Remote Cache)]:::db
  
  classDef component fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef service fill:#002868,stroke:#BF0A30,stroke-width:2px,color:#FFFFFF;
  classDef chain fill:#BF0A30,stroke:#7D100E,stroke-width:2px,color:#FFFFFF;
  classDef p2p fill:#90BE6D,stroke:#43A047,stroke-width:2px;
  classDef backend fill:#CCCCCC,stroke:#666666,stroke-width:1px;
  classDef db fill:#EEEEEE,stroke:#999999,stroke-width:1px;
```

---

For more details, see our comprehensive documentation:
- [Local-First Data Provenance](./LOCAL-FIRST-DATA-PROVENANCE.md)
- [Local-First vs Cache-First Architecture](./LOCAL-FIRST-VERSUS-CACHE.md)
- [Blockchain Persistence Architecture](./BLOCKCHAIN-PERSISTENT-ARCHITECTURE.md)
- [API Documentation](./API-DOCUMENTATION.md)
- [Frontend-API Architecture](./FRONTEND-API-ARCHITECTURE.md)

*ForgeBoard NX — Own your data. Guard your freedom. Build Legendary.* 🦅✨
