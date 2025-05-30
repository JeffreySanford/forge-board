# Security Dashboard: Concepts and Practices

> **Note:** This file documents the ForgeBoard Security Dashboard's internal concepts and practices.  
> It is **not** a GitHub `SECURITY.md` profile file.
>
> If you are looking to set up a `SECURITY.md` for your repository on GitHub, see:  
> https://docs.github.com/en/code-security/policy-and-compliance/enabling-and-displaying-a-security-policy-for-your-repository
>
> GitHub's `SECURITY.md` is a static file for reporting vulnerabilities and outlining security policies.  
> It does **not** support real-time data or dynamic security controls.

**Last Updated: May 30, 2025**

## Introduction

This document outlines the key security concepts, tools, and practices integrated into the ForgeBoard Security Dashboard. The dashboard provides a centralized, real-time view of the application's security posture, enabling proactive threat management, compliance monitoring, and informed decision-making. Each tab and card within the dashboard represents a critical aspect of our comprehensive security strategy.

## Security Dashboard Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Angular Frontend"]
        SD[Security Dashboard Component]
        SD --> VulnMgmt[Vulnerability Management]
        SD --> CompStatus[Compliance Status]
        SD --> ThreatIntel[Threat Intelligence]
        SD --> AccessCtrl[Access Control]
        SD --> SecAlerts[Security Alerts]
        SD --> IncResp[Incident Response]

        subgraph Components ["Shared Components"]
            SecTile[Security Tile]
            SecFooter[Security Footer]
            SecAlertComp[Security Alert Component]
        end

        VulnMgmt & CompStatus & ThreatIntel & AccessCtrl -.-> SecTile
        SD -.-> SecFooter
        SD -.-> SecAlertComp
    end

    subgraph Backend ["NestJS Backend Services"]
        ScanSvc[Scanner Service]
        OscalSvc[OSCAL Service]
        SbomSvc[SBOM Service]
        AuditSvc[Audit Service]
        CompSvc[Compliance Service]
        AlertSvc[Alert Service]

        ScanSvc --> OscalSvc
        ScanSvc --> SbomSvc
        OscalSvc & SbomSvc & AlertSvc --> AuditSvc
        OscalSvc --> CompSvc
    end

    subgraph External ["External Security Tools"]
        Syft[(Syft SBOM Generator)]
        Grype[(Grype Scanner)]
        ZAP[(OWASP ZAP)]
        Cosign[(Cosign Verification)]
        SIEM[(SIEM System)]
    end

    SbomSvc <--> Syft
    ScanSvc <--> Grype
    ScanSvc <--> ZAP
    ScanSvc <--> Cosign
    AlertSvc <--> SIEM

    VulnMgmt <---> ScanSvc & SbomSvc
    CompStatus <---> CompSvc & OscalSvc
    ThreatIntel <---> AlertSvc
    SecAlerts <---> AlertSvc
    IncResp <---> AlertSvc & AuditSvc
    AccessCtrl <---> AuditSvc

    style SD fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
    style ScanSvc fill:#2c3e50,color:#fff,stroke:#1a252f,stroke-width:2px
    style OscalSvc fill:#2c3e50,color:#fff,stroke:#1a252f,stroke-width:2px
    style SbomSvc fill:#2c3e50,color:#fff,stroke:#1a252f,stroke-width:2px
    style Syft fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    style Grype fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    style ZAP fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    style Cosign fill:#f39c12,color:#fff,stroke:#d35400,stroke-width:2px
    style SIEM fill:#9b59b6,color:#fff,stroke:#8e44ad,stroke-width:2px
```

## Core Security Pillars & Dashboard Sections

The Security Dashboard is organized around several core pillars of application and data security:

### 1. Threat & Vulnerability Management

This area focuses on identifying, assessing, and mitigating vulnerabilities within the application and its dependencies.

```mermaid
flowchart LR
    subgraph VulnManagement ["Vulnerability Management Workflow"]
        direction TB
        CodeBase([Source Code & Dependencies]) --> SBOM{SBOM Generation}
        SBOM -->|CycloneDX Format| SCA{SCA Scanning}
        SBOM -->|Signed Artifact| VERIFY{Signature Verification}
        CodeBase --> SAST{Static Analysis}
        Deploy([Deployment Environment]) --> DAST{Dynamic Testing}

        SCA --> CVSS{CVSS Scoring}
        SAST & DAST --> CVSS
        CVSS --> Risk{Risk Assessment}
        VERIFY -->|Valid/Invalid| Risk

        Risk --> |High Risk| POA{Plan of Action}
        Risk --> |Medium Risk| Monitor{Continuous Monitoring}
        Risk --> |Low Risk| Accept{Accept Risk}

        POA --> Remediate{Remediation}
        Remediate --> Verify{Verify Fix}
        Verify --> Monitor

        classDef process fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
        classDef data fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
        classDef risk fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
        classDef action fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px

        class SBOM,SCA,VERIFY,SAST,DAST,CVSS process
        class CodeBase,Deploy data
        class Risk,POA risk
        class Remediate,Verify,Monitor,Accept action
    end
```

- **📦 SBOM (Software Bill of Materials) Status:**

  - **Concept:** An SBOM is a formal, machine-readable inventory of software components and dependencies, including their versions and relationships.
  - **Relevance to ForgeBoard:** Provides transparency into our software supply chain, helps identify outdated or vulnerable third-party libraries quickly, and aids in license compliance. Essential for understanding what's inside our application.

- **🐛 SCA (Software Composition Analysis) Scan Results:**

  - **Concept:** SCA tools automatically scan applications to identify open-source components and their known vulnerabilities.
  - **Relevance to ForgeBoard:** Proactively detects security risks in the libraries and frameworks ForgeBoard relies on. Results are categorized by severity, allowing prioritization of remediation efforts to reduce the application's attack surface.

- **⚡ DAST (Dynamic Application Security Testing) - OWASP ZAP Feedback:**
  - **Concept:** DAST tools test a running application by simulating external attacks to find vulnerabilities like XSS, SQL injection, etc., without needing source code access. OWASP ZAP is a popular open-source DAST tool.
  - **Relevance to ForgeBoard:** Identifies runtime vulnerabilities that might be exploitable by attackers. Helps ensure the application is resilient against common web attack vectors.

### 2. Compliance & Risk Posture

This pillar addresses adherence to regulatory requirements and the overall management of security risks.

```mermaid
flowchart TD
    subgraph ComplianceFramework ["FedRAMP Compliance Framework"]
        direction LR
        Controls[(NIST 800-53\nControl Catalog)] --> |Maps to| FedControls{FedRAMP Controls}
        FedControls --> |Implements| LowImpact[Low Impact\n125 Controls]
        FedControls --> |Implements| ModImpact[Moderate Impact\n325 Controls]
        FedControls --> |Implements| HighImpact[High Impact\n421 Controls]

        subgraph AssessmentProcess ["Assessment Process"]
            direction TB
            SSP[System Security Plan] --> |Reviews| 3PAO[3PAO Assessment]
            3PAO --> |Produces| SAR[Security Assessment Report]
            SAR --> |Identifies Gaps| POAM[Plan of Action & Milestones]
            POAM --> |Addresses| Remediation
            Remediation --> |Verifies| ConMon[Continuous Monitoring]
            ConMon --> |Updates| SSP
        end

        FedControls -.-> SSP

        subgraph DashboardComponents ["Dashboard Components"]
            CompStatus[Compliance Status]
            ControlViz[Control Visualization]
            POAMTrack[POAM Tracking]
            RiskMetrics[Risk Metrics]
        end

        SSP -.-> CompStatus
        3PAO -.-> ControlViz
        POAM -.-> POAMTrack
        ConMon -.-> RiskMetrics

        classDef framework fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
        classDef process fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
        classDef impact fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
        classDef dashboard fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px

        class Controls,FedControls framework
        class SSP,3PAO,SAR,POAM,Remediation,ConMon process
        class LowImpact,ModImpact,HighImpact impact
        class CompStatus,ControlViz,POAMTrack,RiskMetrics dashboard
    end
```

- **🛡️ FedRAMP Compliance (including ConMon & RMF Insights):**

  - **Concept:** FedRAMP (Federal Risk and Authorization Management Program) is a U.S. government-wide program that provides a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services. The Risk Management Framework (RMF) by NIST provides a process that integrates security, privacy, and cyber supply chain risk management activities into the system development life cycle. Continuous Monitoring (ConMon) is a critical part of FedRAMP, requiring ongoing assessment of security controls.
  - **Relevance to ForgeBoard:** Essential if ForgeBoard is to be used by U.S. federal agencies. The dashboard tracks our alignment with FedRAMP controls, supports ConMon activities, and provides insights into the RMF process, demonstrating our commitment to meeting stringent federal security standards.

- **🚦 Real-time Security Control Status:**

  - **Concept:** Security controls are safeguards or countermeasures to avoid, detect, counteract, or minimize security risks. This includes technical controls (like encryption, access controls), operational controls (like incident response plans), and management controls (like security policies).
  - **Relevance to ForgeBoard:** The dashboard provides a live status of critical security controls (e.g., active/inactive, monitored, last checked). This allows for quick assessment of their effectiveness and operational state, which is fundamental to understanding the application's defense capabilities.

- **🎯 POA&M (Plan of Action & Milestones) Tracking:**

  - **Concept:** A POA&M is a document that identifies tasks that need to be accomplished to remediate security weaknesses. It details resources required, milestones, and completion dates.
  - **Relevance to ForgeBoard:** Provides a structured way to manage and track the remediation of vulnerabilities found through scans, audits, or assessments. Essential for FedRAMP and overall risk management, ensuring accountability and progress in security improvement.

- **⚙️ Configuration Compliance:**
  - **Concept:** Involves monitoring system and application configurations against established security baselines (e.g., CIS Benchmarks, DISA STIGs, or custom organizational policies).
  - **Relevance to ForgeBoard:** Helps prevent security weaknesses caused by misconfigurations. Ensures that servers, databases, and application components are hardened and maintained in a secure state, reducing the attack surface.

### 3. Security Operations & Monitoring

This area covers the ongoing activities related to detecting, responding to, and analyzing security events.

```mermaid
flowchart TD
    subgraph SecurityMonitoring ["Security Operations & Monitoring"]
        direction TB

        subgraph DataSources ["Data Sources"]
            Logs[(Application Logs)]
            APIEvents[(API Events)]
            SysMon[(System Metrics)]
            UserAct[(User Activity)]
            ScanRes[(Scan Results)]
            ExtThreat[(External Threats)]
        end

        subgraph Processing ["Processing Pipeline"]
            Collect{Collection Engine}
            Normalize{Normalization}
            Enrich{Enrichment}
            Analyze{Analytics Engine}
            Correlate{Correlation Engine}
        end

        subgraph RealTime ["Real-Time Capabilities"]
            Detect[Threat Detection]
            Alert[Alerting System]
            Respond[Automated Response]
            Visualize[Visualization]
        end

        Logs & APIEvents & SysMon & UserAct & ScanRes & ExtThreat --> Collect
        Collect --> Normalize
        Normalize --> Enrich
        Enrich --> Analyze
        Analyze --> Correlate

        Correlate --> Detect
        Detect --> Alert
        Alert --> Respond
        Correlate --> Visualize

        subgraph Dashboard ["Security Dashboard"]
            LogPanel[Log Highlights Panel]
            EventFeed[Event Feed]
            AlertDash[Alerts Dashboard]
            ThreatMap[Threat Map]
            SecurityScore[Security Score]
        end

        Visualize -.-> LogPanel & EventFeed & AlertDash & ThreatMap & SecurityScore

        classDef source fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
        classDef process fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
        classDef realtime fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
        classDef dashboard fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px

        class Logs,APIEvents,SysMon,UserAct,ScanRes,ExtThreat source
        class Collect,Normalize,Enrich,Analyze,Correlate process
        class Detect,Alert,Respond,Visualize realtime
        class LogPanel,EventFeed,AlertDash,ThreatMap,SecurityScore dashboard
    end
```

- **🔐 Supply Chain Signature Verification:**

  - **Concept:** Verifying the digital signatures of software artifacts, dependencies, and build outputs to ensure their integrity and authenticity.
  - **Relevance to ForgeBoard:** Protects against tampering and ensures that the code and components being used are from trusted sources and haven't been maliciously altered. Crucial for a secure software development lifecycle (SDLC) and DevSecOps.

- **📜 Security Log Highlights (SIEM Integration):**

  - **Concept:** Aggregating, correlating, and analyzing log data from various sources (servers, applications, network devices) using a Security Information and Event Management (SIEM) system.
  - **Relevance to ForgeBoard:** The dashboard shows key alerts and trends from the SIEM, providing an overview of potential security incidents, anomalous activities, or policy violations. Enables faster detection and response.

- **📰 Live Security Event Log Feed:**
  - **Concept:** A real-time stream of important security-related events as they occur.
  - **Relevance to ForgeBoard:** Offers immediate operational awareness of critical alerts, suspicious activities, or significant system status changes, complementing the summarized data from the SIEM.

## Data Flow Architecture

```mermaid
flowchart TD
    subgraph Sources ["Data Sources"]
        SBOM[(SBOM Generation)]
        SCA[(Vulnerability Scans)]
        DAST[(DAST Testing)]
        Cosign[(Signature Verification)]
        OSCAL[(OSCAL Repository)]
        Logs[(Security Logs)]
    end

    subgraph Processors ["Data Processors"]
        Scanner[Scanner Service]
        Parser[OSCAL Parser]
        Enricher[Data Enrichment]
        Correlator[Event Correlator]
        Analyzer[Risk Analyzer]
    end

    subgraph Storage ["Persistence Layer"]
        DBVuln[(Vulnerabilities DB)]
        DBComp[(Compliance DB)]
        DBEvents[(Events DB)]
        BlockChain[(Immutable Ledger)]
    end

    subgraph Gateway ["Gateway Layer"]
        SecGW[Security Gateway]
        MetGW[Metrics Gateway]
        LogGW[Log Gateway]
        DiagGW[Diagnostics Gateway]
    end

    subgraph UI ["Security Dashboard"]
        VulnMgmt[Vulnerability Management]
        CompStatus[Compliance Status]
        ThreatIntel[Threat Intelligence]
        AccessCtrl[Access Control]
        SecAlerts[Security Alerts]
        IncResp[Incident Response]
    end

    SBOM & SCA & DAST --> Scanner
    Scanner --> DBVuln
    Cosign --> Scanner

    OSCAL --> Parser
    Parser --> DBComp

    Logs --> Enricher
    Enricher --> Correlator
    Correlator --> Analyzer
    Analyzer --> DBEvents

    DBVuln & DBComp & DBEvents --> BlockChain

    DBVuln --> SecGW
    DBComp --> SecGW
    DBEvents --> LogGW
    BlockChain --> DiagGW

    SecGW --> VulnMgmt
    SecGW --> CompStatus
    LogGW --> ThreatIntel
    LogGW --> SecAlerts
    DiagGW --> IncResp
    SecGW & LogGW --> AccessCtrl

    classDef source fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
    classDef processor fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    classDef storage fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
    classDef gateway fill:#8e44ad,color:#fff,stroke:#8e44ad,stroke-width:2px
    classDef ui fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px

    class SBOM,SCA,DAST,Cosign,OSCAL,Logs source
    class Scanner,Parser,Enricher,Correlator,Analyzer processor
    class DBVuln,DBComp,DBEvents,BlockChain storage
    class SecGW,MetGW,LogGW,DiagGW gateway
    class VulnMgmt,CompStatus,ThreatIntel,AccessCtrl,SecAlerts,IncResp ui
```

## Security Dashboard Integration with DevSecOps Pipeline

```mermaid
flowchart LR
    subgraph Dev ["Development Phase"]
        Code[Code Repository]
        SAST[Static Analysis]
        Deps[Dependency Check]
    end

    subgraph Build ["Build Phase"]
        CI[CI Pipeline]
        SBOMGen[SBOM Generator]
        SCA[SCA Scanner]
        Sign[Artifact Signing]
    end

    subgraph Deploy ["Deployment Phase"]
        CD[CD Pipeline]
        DAST[DAST Scanning]
        ConfigVal[Config Validation]
    end

    subgraph Runtime ["Runtime Phase"]
        Monitor[Runtime Monitoring]
        ConMon[Continuous Monitoring]
        SIEM[SIEM Integration]
    end

    Code --> SAST --> CI
    Code --> Deps --> CI
    CI --> SBOMGen --> Sign
    CI --> SCA --> Sign
    Sign --> CD
    CD --> DAST --> Monitor
    CD --> ConfigVal --> Monitor
    Monitor --> ConMon
    Monitor --> SIEM

    subgraph Dashboard ["Security Dashboard"]
        VulnView[Vulnerability View]
        CompView[Compliance View]
        MonView[Monitoring View]
        AlertView[Alert View]
    end

    SAST -.-> VulnView
    SCA -.-> VulnView
    DAST -.-> VulnView
    ConfigVal -.-> CompView
    ConMon -.-> MonView
    SIEM -.-> AlertView

    classDef dev fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
    classDef build fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    classDef deploy fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
    classDef runtime fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px
    classDef dash fill:#8e44ad,color:#fff,stroke:#8e44ad,stroke-width:2px

    class Code,SAST,Deps dev
    class CI,SBOMGen,SCA,Sign build
    class CD,DAST,ConfigVal deploy
    class Monitor,ConMon,SIEM runtime
    class VulnView,CompView,MonView,AlertView dash
```

## Preliminary Notes on Security Scanning Scripts & Logs (ForgeBoard Context)

The ForgeBoard workspace includes security scanning capabilities, primarily within the `scripts/oscal/` directory. These scripts leverage tools like OpenSCAP for performing compliance scans against defined security profiles (e.g., FedRAMP baselines).

```mermaid
flowchart TD
    subgraph ScanScripts ["Security Scanning Scripts"]
        Scanner["oscal-scanner.go"]
        ShellScripts["Shell Scripts (*.sh)"]
        Config["OSCAL Profiles & Configurations"]
    end

    subgraph ExternalTools ["External Tools"]
        OpenSCAP["OpenSCAP CLI"]
        SCAP["SCAP Security Guide"]
        JQ["JQ Parser"]
    end

    subgraph OutputFiles ["Scan Outputs"]
        ARF["ARF XML Reports"]
        HTML["HTML Reports"]
        JSON["JSON Results"]
        Logs["Log Files"]
    end

    Scanner --> |"Executes via syscall"| OpenSCAP
    ShellScripts --> |"Orchestrates"| Scanner
    ShellScripts --> |"Processes"| JQ
    Config --> Scanner
    OpenSCAP --> |"Uses"| SCAP

    OpenSCAP --> ARF
    OpenSCAP --> HTML
    OpenSCAP --> JSON
    Scanner & ShellScripts --> Logs

    subgraph Integration ["Dashboard Integration"]
        Parser["Results Parser"]
        DB["Security Database"]
        API["Security Dashboard API"]
        UI["Security Dashboard UI"]
    end

    ARF & HTML & JSON --> Parser
    Parser --> DB
    DB --> API
    API --> UI

    classDef scripts fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:2px
    classDef tools fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:2px
    classDef outputs fill:#f1c40f,color:#000,stroke:#f39c12,stroke-width:2px
    classDef integration fill:#2ecc71,color:#fff,stroke:#27ae60,stroke-width:2px

    class Scanner,ShellScripts,Config scripts
    class OpenSCAP,SCAP,JQ tools
    class ARF,HTML,JSON,Logs outputs
    class Parser,DB,API,UI integration
```

- **OSCAL (Open Security Controls Assessment Language) Scripts:**
  - Located in `c:\repos\forge-board\scripts\oscal\`.
  - Scripts like `oscal-scanner.go` (and its compiled executable) are designed to run `oscap` (OpenSCAP command-line tool) commands.
  - Shell scripts (`*.sh`) in this directory likely orchestrate these scans, potentially targeting specific SCAP (Security Content Automation Protocol) content like the `scap-security-guide`.
- **Log Generation (Preliminary):**
  - The `oscal-scanner.go` tool itself, when executing `oscap`, will produce output (e.g., ARF reports, HTML reports, XCCDF results). The `runOscapScan` function specifies output file paths.
  - Standard output and standard error from these scripts could be redirected to log files, though specific log file locations and formats from the shell scripts require further investigation.
  - The root `logs/` directory currently contains trace files (e.g., `Trace-20250529T113552.json`), which might be related to application performance or debugging rather than specific security scan outputs.
  - Further analysis of the `.sh` scripts in `scripts/oscal/` and any scripts in `scripts/security/` will be needed to determine definitive log output locations and formats for security scanning activities.

## Component Interaction Model

```mermaid
sequenceDiagram
    %%{init: {
        'theme': 'base',
        'themeVariables': {
            'primaryColor': '#BF0A30',
            'primaryTextColor': '#fff',
            'primaryBorderColor': '#7D100E',
            'lineColor': '#002868',
            'secondaryColor': '#002868',
            'tertiaryColor': '#F9C74F'
        }
    }}%%
    participant User as User
    participant SD as Security Dashboard
    participant API as Backend API
    participant Scanner as Scanner Service
    participant Tools as Security Tools
    participant Storage as Databases & SlimChain

    User->>SD: Access Security Dashboard
    SD->>API: Request Security Data

    rect rgba(255, 225, 225, 0.3)
        Note right of API: EXCEEDS STANDARD: Server-Authoritative Architecture
        API->>Scanner: Request Scan Status
        Scanner->>Tools: Execute Scans
        Tools-->>Scanner: Return Results
    end

    rect rgba(225, 225, 255, 0.3)
        Note right of Storage: EXCEEDS STANDARD: Complete Data Provenance
        Scanner-->>Storage: Persist Results with Cryptographic Verification
        Storage-->>API: Retrieve Scan Data with Full Lineage
    end

    API-->>SD: Return Security Data
    SD-->>User: Display Security Information

    User->>SD: Request Report Details
    SD->>API: Fetch Report Data

    rect rgba(225, 255, 225, 0.3)
        Note right of API: EXCEEDS STANDARD: SlimChain Ledger Integration
        API->>Storage: Query Detailed Report with Immutable History
        Storage-->>API: Return Report Data with Merkle Proofs
    end

    API-->>SD: Return Details
    SD-->>User: Display Detailed Report

    User->>SD: Initiate New Scan
    SD->>API: Request New Scan

    rect rgba(255, 240, 200, 0.3)
        Note right of API: EXCEEDS STANDARD: RXJS Real-Time Observables
        API->>Scanner: Trigger Scan with Context Tracking
        Scanner->>Tools: Execute Security Tool with Signature Verification
        Tools-->>Scanner: Return Real-time Results
        Scanner-->>API: Stream Results via Observable Pattern
        API-->>SD: Stream Status Updates with Provenance Metadata
    end

    SD-->>User: Display Scan Progress
```

### Legend: ForgeBoard NX Security Excellence

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0;">
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Security Dashboard:</strong> FedRAMP 20X-Ready UI
  </div>
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Backend API:</strong> Server-Authoritative Architecture
  </div>
  <div style="background-color: #F9C74F; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Scanner Service:</strong> Zero Trust Security Validation
  </div>
  <div style="background-color: #90BE6D; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Security Tools:</strong> Continuous Assessment Pipeline
  </div>
  <div style="background-color: #8E44AD; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Databases & SlimChain:</strong> Cryptographic Provenance
  </div>
</div>

### ForgeBoard NX's Standards-Exceeding Capabilities

<table style="width:100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <thead>
    <tr style="background-color: #002868; color: white;">
      <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Capability</th>
      <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">FedRAMP Requirement</th>
      <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">How ForgeBoard Exceeds</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: rgba(255, 225, 225, 0.3);">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Server-Authoritative Architecture</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">Basic client-server separation</td>
      <td style="padding: 10px; border: 1px solid #ddd;">Server as definitive source of truth with complete audit trails and cryptographically verified data flows</td>
    </tr>
    <tr style="background-color: rgba(225, 225, 255, 0.3);">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Complete Data Provenance</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">Limited data origin tracking</td>
      <td style="padding: 10px; border: 1px solid #ddd;">Full lifecycle tracking from origin through disposal with server-side cryptographic verification and non-repudiation</td>
    </tr>
    <tr style="background-color: rgba(225, 255, 225, 0.3);">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>SlimChain Ledger</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">Standard database logging</td>
      <td style="padding: 10px; border: 1px solid #ddd;">Immutable, tamper-proof blockchain ledger with auto-compression and Merkle Proof exports</td>
    </tr>
    <tr style="background-color: rgba(255, 240, 200, 0.3);">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>RXJS Observables</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">Basic event notifications</td>
      <td style="padding: 10px; border: 1px solid #ddd;">Real-time reactive data streams with server-originated provenance tracking operators and zero trust validation</td>
    </tr>
  </tbody>
</table>
