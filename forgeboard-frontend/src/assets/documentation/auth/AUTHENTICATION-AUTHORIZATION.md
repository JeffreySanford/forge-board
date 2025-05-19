# ForgeBoard: Authentication & Authorization Master Guide

*Last Updated: May 19, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Category:</strong> Authentication & Authorization
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> Production Ready
  </div>
</div>

---

## Overview

This document provides a comprehensive overview of ForgeBoard's authentication and authorization architecture, including our robust RBAC (Role-Based Access Control) implementation. It details how our solution not only meets but exceeds NIST SP 800-53 Rev 5 and FedRAMP 20x requirements for identity, access, and privilege management.

---

## Authentication Architecture

- **Multi-Factor Authentication (MFA):** Enforced for all privileged and user accounts, supporting TOTP, WebAuthn, and FIDO2.
- **OAuth 2.1 & OpenID Connect:** Used for federated identity and SSO integration with enterprise IdPs.
- **Password Policy:** Enforced complexity, rotation, and breach detection using HaveIBeenPwned API.
- **Session Management:** Secure, short-lived JWTs with refresh tokens, device binding, and inactivity timeouts.
- **Continuous Authentication:** Risk-based adaptive authentication using device fingerprinting and behavioral analytics.

---

## Authorization & RBAC

### Role-Based Access Control (RBAC)
- **Hierarchical Roles:** Supports nested roles (e.g., Admin > Manager > User) for scalable privilege management.
- **Attribute-Based Access Control (ABAC) Extensions:** Policies can include user attributes, resource tags, and environmental context.
- **Dynamic Permission Assignment:** Permissions are assigned at runtime based on user, group, and context.
- **Least Privilege Enforcement:** All APIs and UI components check permissions before granting access.
- **Audit Logging:** All access control decisions are logged for compliance and forensics.

#### Example RBAC Policy
```json
{
  "role": "Manager",
  "permissions": [
    "metrics:read",
    "metrics:write",
    "user:invite",
    "kanban:edit"
  ],
  "inherits": ["User"]
}
```

---

## Exceeding Rev 5 & FedRAMP 20x Standards

- **NIST SP 800-53 Rev 5 Alignment:**
  - AC-2: Automated account provisioning and deprovisioning
  - AC-3: Fine-grained access enforcement at API, service, and UI levels
  - AC-6: Least privilege and separation of duties
  - IA-2: MFA for all access, including privileged and remote
  - AU-2: Comprehensive audit logging and reporting
- **FedRAMP 20x Enhancements:**
  - KSI-IAM: Phishing-resistant MFA, SSO, and strong password enforcement
  - KSI-PI: Automated policy enforcement and asset inventory
  - KSI-LOG: Real-time logging of all authentication and authorization events
  - KSI-ABAC: Support for dynamic, context-aware access policies

---

## Implementation Details

- **Backend:**
  - NestJS Passport strategies for JWT, OAuth, and SAML
  - Centralized AuthService for token issuance and validation
  - Policy engine for RBAC/ABAC enforcement
- **Frontend:**
  - Angular guards and interceptors for route and API protection
  - UI adapts dynamically to user roles and permissions
  - Secure storage of tokens using HttpOnly cookies or secure local storage

---

## Example: Angular Route Guard
```typescript
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    if (this.auth.hasRoles(requiredRoles)) {
      return true;
    }
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

---

## Audit & Compliance
- **Automated Reporting:** Scheduled compliance reports for all access events
- **Real-Time Alerts:** Immediate notification of suspicious or unauthorized activity
- **Continuous Monitoring:** Integration with SIEM and cloud security tools

---

## Related Documents
- [FedRAMP Compliance & Coding Standards](../compliance/COMPLIANCE-AND-CODING-STANDARDS.md)
- [NIST SP 800-53 Rev 5](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [FedRAMP 20x Key Security Indicators](../0006-key-security-indicators.pdf)

---

*This document is the authoritative source for ForgeBoard authentication and authorization. For implementation details, see referenced files and code examples in the repository.*
