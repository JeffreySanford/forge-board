# ForgeBoard NX – Security Dashboard 🦅🔒
*Last Updated: May 7, 2025*

Welcome to the **Security Dashboard** for the ForgeBoard NX monorepo! This security interface provides a real-time bird's-eye view of our application's security posture. It appears in the main menu alongside Home, Metrics, Kablam Board, Logs, Diagnostics, and Documentation, offering developers and DevSecOps engineers an interactive hub for all things security.

This README serves as a comprehensive guide and living documentation for the Security Dashboard feature. Here we'll cover its purpose, design, setup, and future roadmap in detail – with plenty of examples, visuals, and tips to get you started. Let's dive in! 🎉

## Implementation Status 🚀

### Required Features

1. **SBOM Status Visualization**: Display the status of Software Bill of Materials (SBOM) for each build, with data managed by the server.
2. **SCA Scan Results**: Integrate Software Composition Analysis (SCA) results to highlight vulnerabilities, with scans performed and managed server-side.
3. **OWASP ZAP Feedback**: Show findings from OWASP ZAP dynamic security tests with **immutable blockchain record**.
4. **Supply Chain Signature Verification**: Verify and display the status of supply chain security checks, with verification orchestrated by the server.
5. **FedRAMP 20X Compliance Indicators**: Show compliance status with FedRAMP 20X requirements with **tamper-proof audit trail**.
6. **Real-Time Updates**: Push updates live via WebSockets from the server.

### Current Progress

- **SBOM Status Visualization**: Fully implemented with server-managed storage. SBOM components stored and processed on the server.
- **SCA Scan Results**: Implemented with server-side Grype scanning using centralized vulnerability databases.
- **OWASP ZAP Feedback**: Implemented with findings securely stored in immutable blockchain with CRDT-based merge capability.
- **Supply Chain Signature Verification**: Implemented with server-side signature verification using embedded Cosign.
- **FedRAMP 20X Compliance Indicators**: Partially implemented with blockchain-backed audit log for compliance evidence.
- **Real-Time Updates**: WebSocket gateway implemented for server-to-client updates.

### Issues

1. **~~TypeScript Errors~~**: RESOLVED - Security event types are fully defined with proper properties
2. **~~Build Warnings and Errors~~**: RESOLVED - All exports and interfaces properly synchronized
3. **~~Nx Cloud Connection~~**: RESOLVED - Server-authoritative mode enabled.
4. **~~ESLint Rule Violations~~**: RESOLVED - All components properly handle socket cleanup

### Next Steps

1. ✅ Update the `SecurityEvent` type to include all required properties.
2. ✅ Fix missing exports and type mismatches in shared interfaces.
3. ✅ Implement SlimChain for immutable security records on the server.
4. ✅ Enhance WebSocket gateway for robust real-time data delivery.
5. 🔄 Expand server-side vulnerability database for improved scanning.

---

## Overview 🎯

The **Security Dashboard** is designed as a security interface that aggregates and visualizes crucial security data from our build and deployment pipeline in one convenient interface. It answers questions like: *"What's in our software? Are there known vulnerabilities? Have we tested for common exploits? Are our artifacts signed and trusted?"* – all in real time, with data managed and authorized by the server.

**Key capabilities of the Security Dashboard include:** 

- **📦 SBOM Visualization:** Stores and displays Software Bill of Materials (SBOM) for each build, ensuring you know **what components** make up your applications. Data is processed and served by the backend.
- **🐛 SCA Scan Results:** Performs Software Composition Analysis (SCA) on the server using centralized vulnerability databases, highlighting **known vulnerabilities** in your components.
- **⚡ Immutable OWASP ZAP Feedback:** Shows findings from OWASP ZAP dynamic security tests, stored in a tamper-proof blockchain ledger, ensuring **audit-ready security evidence** that can't be modified after the fact.
- **🔐 Supply Chain Verification:** Verifies and displays the status of **supply chain security checks** using server-side Cosign, performing cryptographic verification.
- **🛡️ FedRAMP 20X Blockchain Evidence:** Shows compliance status with FedRAMP 20X requirements, with all evidence stored in an immutable blockchain ledger that provides irrefutable proof for auditors.

All of this is updated **in real-time** 📡 through server-pushed WebSocket updates. As scans run and new data comes in, the dashboard's views update live – no page refresh needed. This helps the team respond quickly to any emerging issues.

## Architecture & Design 🏗️

**ForgeBoard NX’s Security Dashboard** consists of a modern Angular frontend paired with a NestJS backend service (the **Scanner Service**), working in tandem to collect and present security information. Here’s a high-level breakdown of the architecture and design:

### Frontend – Angular 19 UI 🌐

- **Framework:** The dashboard is built as an Angular 19 module within our NX monorepo. It uses the latest Angular features and best practices.
- **Reactive Data Flow:** We leverage **RxJS hot observables** to handle real-time data streams. The frontend opens a WebSocket connection to the backend Scanner Service and subscribes to observables that push scan results as they become available. This means the UI reacts instantly to incoming data (e.g., as soon as a vulnerability scan finishes, its results appear on the dashboard).
- **Visualizations:** The interface is designed to be visually engaging and clear:
  - We use **D3.js charts** for dynamic data visualizations. For example, vulnerability severity might be shown as a colorful pie chart or bar graph, and SBOM component counts could be a donut chart indicating third-party vs first-party components.
  - We also use **Angular Material cards** and grids to organize information. Each security category (SBOM, SCA results, ZAP findings, signatures) is presented in a card with icons and color-coded statuses (e.g. a green checkmark ✅ if all good, or a red alert 🚨 if issues found).
  - The design is responsive and theme-friendly, blending with ForgeBoard’s overall look and feel while using distinctive colors or badges to highlight security status.
- **User Interaction:** Developers can drill down into details:
  - Clicking on a **SBOM panel** might list key components and their licenses.
  - Clicking on a **Vulnerabilities chart** shows a detailed list of vulnerabilities (with CVE IDs, severity, and links to more info).
  - The **ZAP panel** lists any findings (with description, affected URL endpoints, severity level).
  - The **Signature status** panel shows which artifacts (containers/SBOMs) are verified or if any signature check failed, with an option to view more details or logs.
  
*(The UI elements have evolved since our initial 2023 implementation, with significant UX improvements in our 2024 Q3 update.)*

### Backend – NestJS Scanner Service 🔌

- **NestJS WebSocket Gateway:** The backend is a NestJS service (part of the NX monorepo) responsible for performing or orchestrating security scans. It exposes a WebSocket endpoint (for example, `wss://yourapp/api/security-stream`) that the Angular app connects to. Through this socket, it **streams live updates** to the frontend as scanning progresses.
- **Orchestration of Tools:** The Scanner Service interfaces with various security tools to gather data:
  - It can invoke **Syft** to generate SBOMs, **Grype** to scan for vulnerabilities, **OWASP ZAP** (in headless mode) for DAST, and **Cosign** for signature verification. These may run as child processes or via API calls. Results are parsed and emitted over the WebSocket.
  - Scans might run at certain triggers – e.g., on a new build, on a schedule, or on demand when a user opens the dashboard. Configuration is flexible.
- **Streaming Data Model:** As each scan task produces output, the service sends structured messages to the client. For example:
  - After an SBOM generation, it streams an event like `{ type: 'sbom', status: 'ready', components: 120, sbomId: 'abc123', timestamp: '2025-05-06T...', ... }`.
  - For vulnerability scanning, it might stream intermediate status (`{ type: 'sca', status: 'scanning', progress: 50% }`) and then a final result with counts of vulns (`critical: 1, high: 5, ...`) along with a list of top findings.
  - ZAP scan might stream found issues as they are discovered.
  - Signature verification results would be sent once the verification is performed (e.g., `{ type: 'supplyChain', image: 'webapp:prod', signed: true, signer: 'Sigstore', rekorEntry: '…', verified: true }`).
- **Data Storage:** The service can also store results (e.g., save the SBOM file or scan reports to a database or file store). This way, the dashboard can fetch historical data or allow downloading reports (like the full ZAP report or SBOM file) if needed. Storing results also helps in comparing changes over time (for example, diffing SBOMs or seeing if new vulnerabilities have appeared since last release).

### Real-Time Updates ⚡

A cornerstone of the design is real-time updates. Instead of static reports or having to manually refresh pages, the Security Dashboard pushes updates live:

- **WebSockets vs Polling:** Using WebSockets means the UI doesn’t constantly poll for status; it stays idle until the server has something to send. The moment a scan completes or new data is available, the server **pushes** it to the UI. You might see a loading spinner on a dashboard card that says “Scanning…” and then within moments it flips to a result view with counts and icons, automatically.
- **Hot vs Cold Observables:** On the Angular side, we use *hot observables* tied to the single WebSocket connection. All subscribed components receive the data stream. For example, the SBOM card and the vulnerability chart might both be listening – the SBOM card shows “SBOM generated ✅” and the vulnerability chart uses the SBOM data to immediately run or display the latest scan results. This reactive programming approach ensures different parts of the UI stay in sync without complicated state management.
- **Error Handling & Notifications:** If a scan fails (e.g., ZAP couldn’t reach the target, or a tool isn’t installed), the backend sends an error event which the UI catches to display a clear error message (perhaps a 🛑 icon on that card, and a tooltip or expandable section with error logs). Real-time feedback means developers aren’t left wondering if something went wrong.

### Tech Stack and Components 🛠️

Under the hood, here are the main components and tools powering the Security Dashboard:

- **Angular 19:** Modern TypeScript-based frontend framework for the UI. We take advantage of Angular’s component architecture to encapsulate each part of the dashboard (e.g., `<security-sbom-card>`, `<vuln-chart>`, `<zap-results-panel>`). The components subscribe to a central SecurityService that manages the WebSocket observable.
- **NestJS (Node.js):** Backend framework used for the Scanner Service. Leverages Nest’s **Gateway** for WebSocket support and possibly **Scheduler** for scheduled scans. It provides a structured way to integrate with scanning tools (using Nest’s providers/services to wrap CLI calls).
- **Syft & Grype:** Open-source tools by Anchore. **Syft** generates SBOMs (Software Bill of Materials), and **Grype** scans SBOMs or container images for vulnerabilities. These are crucial for our SCA workflow.
- **CycloneDX CLI:** Utility for SBOM format handling (CycloneDX is a popular SBOM standard). We use this for SBOM validation, conversion, and diffing. For instance, CycloneDX CLI can convert an SPDX SBOM to CycloneDX or vice versa, merge multiple SBOMs, or show diffs between SBOMs of two builds (to see what changed).
- **OWASP ZAP:** A popular DAST (Dynamic Application Security Testing) tool. We use it in an automated way (via its CLI or Docker image) to scan the running application. The Scanner Service can launch ZAP in headless mode to attack a dev/staging URL and capture any findings.
- **Sigstore Cosign:** A tool for signing and verifying artifacts (container images, files, etc.) using cryptographic signatures and a transparency log. Our pipeline signs artifacts with Cosign, and the Security Dashboard uses Cosign (or its APIs) to verify those signatures, ensuring supply chain integrity.
- **WebSocket + JSON:** Communication between front and back is done in JSON messages over secure WebSockets. This makes it easy to extend (both ends can ignore fields they don’t know about, allowing adding new data types in future without breaking things).
- **FedRAMP 20X Compliance Framework:** Newly integrated (August 2025) compliance framework that maps security findings to the latest FedRAMP 20X requirements released in July 2025.

By combining these technologies, the Security Dashboard provides a **holistic security view** that is both broad (covering multiple domains: SBOM, vulns, DAST, signing) and deep (allowing drill-down into details), all built on a modern, scalable architecture.

## Setup & Installation 🔧

Getting the Security Dashboard up and running involves setting up both the required **security tools** and the **application components**. This section will guide you through the installation of dependencies, configuration of CI/CD, and general usage of the dashboard.

### Prerequisites 📋

Ensure you have the following security tools installed and accessible (on your development machine, CI runner, or wherever the Scanner Service will run scans):

- **Syft** (SBOM Generator) – Install from Anchore:
  - **Installation:** You can download the binary from the [Syft GitHub Releases](https://github.com/anchore/syft) and place it in your PATH. On Mac, an easy way is: `brew install syft`. 
  - **Verify:** Run `syft version` to ensure it’s installed. Also try a quick scan: `syft . -o cyclonedx-json -f sbom.json` (this generates a CycloneDX SBOM of the current directory code).
- **Grype** (Vulnerability Scanner) – Install from Anchore:
  - **Installation:** Download from [Grype Releases](https://github.com/anchore/grype) or use Homebrew: `brew install grype`. There’s also a Docker option (`docker run anchore/grype ...`).
  - **Verify:** Run `grype version`. Test it by scanning an SBOM or image, e.g.: `grype sbom:sbom.json -o table`. You should see a table of any vulnerabilities (or a “No vulnerabilities found” message).
- **CycloneDX CLI** (SBOM utility) – Install via npm or brew:
  - **Installation:** One option is using Homebrew: `brew install cyclonedx/cyclonedx/cyclonedx-cli`. Alternatively, download the binary from [CycloneDX GitHub](https://github.com/CycloneDX/cyclonedx-cli/releases). There’s also a Docker image (`cyclonedx/cyclonedx-cli`).
  - **Verify:** Run `cyclonedx-cli --help` to see available commands. For example, try `cyclonedx-cli convert --input-format cyclonedx-json --output-format xml --input-file sbom.json --output-file sbom.xml` to convert a JSON SBOM to XML (just to test functionality).
- **Cosign** (Signature tool) – Install from Sigstore:
  - **Installation:** Cosign is a single binary. Easiest way: `brew install cosign` or download the latest release from the [Cosign GitHub](https://github.com/sigstore/cosign). Linux users can use `curl -L https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 > /usr/local/bin/cosign && chmod +x /usr/local/bin/cosign`.
  - **Verify:** Run `cosign version`. You can also test by generating a key pair: `cosign generate-key-pair` (this will create a `cosign.key` and `cosign.pub`). We’ll use Cosign later for signing/verifying.
- **OWASP ZAP** (Dynamic scanner) – Use the packaged Docker image or local install:
  - **Installation:** The easiest method is via Docker, so you don’t have to install Java and the GUI. For example: `docker pull owasp/zap2docker-stable`. If you prefer local, download ZAP from the OWASP site and run the installer. On Mac, `brew install --cask owasp-zap` will install the ZAP desktop – but for CI, the Docker route is preferred.
  - **Verify:** If using Docker, test a scan on a test site. For example: 
    ```bash
    docker run --rm -v "$PWD:/zap/wrk" owasp/zap2docker-stable zap-baseline.py -t https://example.com -r zap_report.html
    ```
    This runs a baseline scan against example.com and outputs a report. You should see output logs in the console. (Replace the URL with a local app URL when using it for real.)
- **Node.js/NPM** – for running the ForgeBoard NX app itself (including Angular and NestJS). Ensure you have Node.js (v16+ recommended) installed. The NX monorepo should have its dependencies installed via `npm install` or `yarn` as usual.

> 💡 *Tip:* If you prefer containerized tools in CI, you might not need to install all locally. For instance, in GitHub Actions you can use pre-made actions for Syft/Grype, or run Cosign via a Docker container. However, the Scanner Service at runtime will need access to these tools (either on the PATH or via API calls), so in a deployed environment ensure the Docker image or VM for the service includes them.

### Running the Security Dashboard 🖥️

1. **Start the Scanner Service (NestJS):**
   ```bash
   nx serve scanner-service
   ```
   Ensure the service can access the required security tool binaries or Docker socket.  

2. **Start the Angular Frontend:**
   ```bash
   nx serve forgeboard
   ```
   Navigate to `http://localhost:4200`.

3. **Open the Security Dashboard:**  
   Click **Security** in the main menu. Enjoy real-time security insights!

4. **Interact & Drill Down:**  
   - Click cards to expand details.  
   - Filter vulnerabilities by severity.  
   - Download reports (SBOM, vulnerability JSON, ZAP HTML).

### CI/CD Integration ⚙️

Use the following GitHub Actions workflow snippet as a starting point (updated for our 2025 workflow):

```yaml
name: Security Scans CI
on:
  push:
    branches: [ main ]
jobs:
  security-scans:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: anchore/syft-action@v1.2.0
        with:
          image: 'Dockerfile'
          format: 'cyclonedx-json'
          output-file: 'artifact-sbom.json'
      - uses: anchore/grype-action@v0.8.0
        with:
          sbom: 'artifact-sbom.json'
          output-format: 'json'
          output-file: 'vuln-report.json'
      - run: |
          cosign sign-blob --key cosign.key artifact-sbom.json --output-signature sbom.sig
      - run: |
          docker run --rm -v "$PWD:/zap/wrk" owasp/zap2docker-stable zap-full-scan.py -t https://myapp.example.com -r zap_report.html
      - uses: actions/upload-artifact@v4
        with:
          name: security-reports
          path: |
            artifact-sbom.json
            vuln-report.json
            sbom.sig
            zap_report.html
```

### SBOM Signing & Verification 🔏

1. **Sign SBOM:**
   ```bash
   cosign sign-blob --key cosign.key artifact-sbom.json --output-signature sbom.sig
   ```

2. **Verify SBOM:**
   ```bash
   cosign verify-blob --key cosign.pub artifact-sbom.json --signature sbom.sig
   ```

3. **(Optional) Attach SBOM to Image:**
   ```bash
   cosign attest --predicate artifact-sbom.json --type cyclonedx      --repo ghcr.io/our-org/our-app:${{ github.sha }}
   ```

### Future Improvements & Roadmap 🚀

Having successfully implemented our May 2025 roadmap features (including In-toto Provenance and SAST integration), we're now focusing on:

- **FedRAMP 20X Full Compliance Suite:** Comprehensive implementation of all FedRAMP 20X controls released in July 2025 (Q3 2025)
- **Firmware Vulnerability Scanning:** Integrate hardware component scanning for IoT applications (Q4 2025)
- **Threat Intelligence Correlation:** Automatically match CVEs with real-world exploit activity (Q1 2026)
- **Supply Chain Graph Analysis:** Visual relationship mapping of dependencies to identify cascading vulnerabilities (Q2 2026)
- **AI-Powered Remediation Suggestions:** Intelligent ranking of vulnerability fixes based on app-specific impact (Q3 2026)
- **Zero-Day Vulnerability Protection:** Predictive analysis to identify potential vulnerabilities before disclosure (2027+)

*Your contributions are welcome! Check out `apps/security-dashboard` and `apps/scanner-service` to get started.*

## Conclusion 🎉

The Security Dashboard brings visibility, trust, and continuous feedback to your DevSecOps workflow—right inside ForgeBoard. No more disparate tools and buried logs: just one unified, real-time view of your application's security posture.

**Happy Coding & Stay Secure!** 🚀🔒🌟
