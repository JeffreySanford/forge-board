# ForgeBoard NX
*Last Updated: May 15, 2025*

A sovereign monitoring and management dashboard with comprehensive data provenance tracking, secure in-house data management, and blockchain persistence.

## Documentation

All project documentation is stored in the **assets/documentation** folder. This documentation is dynamically loaded and displayed in the application's Documentation page.

To add new documentation:
1. Add markdown (.md) files to the `forgeboard-frontend/src/assets/documentation` directory
2. Organize files in subdirectories to create documentation categories
3. The documentation will be automatically loaded and displayed in the Documentation page

For API-specific documentation, please see the Swagger UI at `/api` when the server is running.

## Features

- **Data Provenance Tracking**: Complete lifecycle tracking of all data from inception through disposal
- **Secure In-House Architecture**: Your server is the source of authority for all data
- **Blockchain Persistence**: Immutable, tamper-evident record of all changes
- **Real-Time Dashboards**: Live metrics, logs, and diagnostics
- **FedRAMP 20X Ready**: Built to exceed the latest federal security requirements

## System Architecture

ForgeBoard NX's architecture is built around maintaining complete data provenance:

```mermaid
flowchart TD
    subgraph "Server Environment"
        Frontend["Frontend (Angular)"]
        ServerDB[(Server Database)]
        LiteChain["SlimChain Node"]
        Provenance["Provenance Engine"]
    end
    
    subgraph "Optional Redundancy"
        BackupServer["Backup Server (Optional)"]
        RemoteDB[(Remote Database)]
    end
    
    Frontend -->|"Data with Provenance"| ServerDB
    Frontend -->|"Provenance Tracking"| Provenance
    Provenance -->|"Persist Lifecycle Events"| LiteChain
    ServerDB -->|"Optional Backup Sync"| BackupServer
    LiteChain -->|"Blockchain Federation"| BackupServer
    BackupServer -.->|"Disaster Recovery"| RemoteDB
    
    class Frontend,ServerDB,LiteChain,Provenance server;
    class BackupServer,RemoteDB backup;
    
    classDef server fill:#002868,color:#FFFFFF,stroke:#BF0A30,stroke-width:2px;
    classDef backup fill:#F0F0F0,color:#333333,stroke:#999999,stroke-width:1px;
```
