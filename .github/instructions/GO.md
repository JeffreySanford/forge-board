# 🛠️ ForgeBoard Go (Golang) Contribution & Coding Standards

## Overview
This guide details standards for Go microservices in ForgeBoard:
- **Project Structure**: Idiomatic Go layout (cmd, pkg, internal, etc.), self-contained/stateless services.
- **Linting**: Use golangci-lint for linting/static analysis.
- **Testing**: Table-driven tests for all exported functions.

## Guidelines
- **Context**: Use context for all I/O/network ops.
- **Composition**: Prefer composition over inheritance.
- **API**: Use gRPC or REST for service comms, document all exported types/functions.

---
