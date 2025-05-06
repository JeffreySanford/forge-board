# ForgeBoard NX - OSCAL Development Guide

This developer guide provides technical details for working with the OSCAL (Open Security Controls Assessment Language) integration in ForgeBoard NX.

## 1. Development Environment Setup

### Required Tools

As specified in the [FedRAMP Automation Repository](https://automate.fedramp.gov/start/#required-tools), you'll need the following tools:

- **Node.js** (as versioned in .nvmrc)
- **Java 8+** (for XSLT processing)
- **Python 3.9+** (for automation scripts)
- **GNU Make**
- **Docker** (for container-based validation)

### Environment Configuration

```bash
# Clone the ForgeBoard repository
git clone https://github.com/your-org/forge-board.git

# Install dependencies
npm install

# Install OSCAL dependencies
npm run oscal:install
```

## 2. OSCAL Integration Architecture

### Component Overview

```
┌───────────────────────┐      ┌────────────────────┐
│                       │      │                    │
│  ForgeBoard Frontend  │◄────►│  OSCAL Components  │
│                       │      │                    │
└───────────┬───────────┘      └────────────────────┘
            │                          ▲
            │                          │
            ▼                          │
┌───────────────────────┐      ┌──────────────────┐
│                       │      │                  │
│   ForgeBoard API      │◄────►│  OSCAL Services  │
│                       │      │                  │
└───────────┬───────────┘      └──────────────────┘
            │                          ▲
            │                          │
            ▼                          │
┌───────────────────────┐      ┌──────────────────┐
│                       │      │                  │
│      Data Layer       │◄────►│   OSCAL Store    │
│                       │      │                  │
└───────────────────────┘      └──────────────────┘
```

## 3. Key Classes and Interfaces

### OSCAL Interfaces

```typescript
// Core interfaces for OSCAL components
export interface OSCALComponent {
  uuid: string;
  type: ComponentType;
  title: string;
  description: string;
  props?: OSCALProperty[];
  controlImplementations?: ControlImplementation[];
}

export interface ControlImplementation {
  uuid: string;
  source: string;  // Reference to the source catalog
  description?: string;
  implementedRequirements: ImplementedRequirement[];
}

export interface ImplementedRequirement {
  uuid: string;
  controlId: string;
  description?: string;
  statements: Statement[];
}

// Additional interfaces as needed
```

### Service Classes

```typescript
// Main service for OSCAL document generation using RxJS
@Injectable()
export class OSCALGeneratorService {
  // Subject for OSCAL generation status updates
  private generationStatusSubject = new BehaviorSubject<GenerationStatus>(null);
  public generationStatus$ = this.generationStatusSubject.asObservable();
  
  constructor(
    private componentService: ComponentService,
    private controlService: ControlService,
    private configService: ConfigurationService,
    private loggerService: LoggerService,
    private auditService: AuditService
  ) {}

  // Generate SSP as an Observable stream
  generateSSP(config: OSCALConfig): Observable<OSCALSystemSecurityPlan> {
    this.loggerService.debug('Starting SSP generation', { config });
    this.generationStatusSubject.next({ status: 'started', progress: 0 });
    
    // Audit the generation start
    this.auditService.logAction({
      action: 'OSCAL_SSP_GENERATION_STARTED',
      details: { baselineProfile: config.baselinePath }
    });
    
    return this.componentService.getComponents().pipe(
      tap(() => this.generationStatusSubject.next({ status: 'loading_components', progress: 20 })),
      switchMap(components => {
        return this.controlService.getControlImplementations(config.baselinePath).pipe(
          tap(() => this.generationStatusSubject.next({ status: 'processing_controls', progress: 40 })),
          map(controls => {
            // Build the SSP structure
            const ssp = this.buildSspDocument(components, controls, config);
            this.generationStatusSubject.next({ status: 'complete', progress: 100 });
            
            // Audit successful generation
            this.auditService.logAction({
              action: 'OSCAL_SSP_GENERATION_COMPLETED',
              details: { 
                documentId: ssp.uuid,
                componentCount: components.length,
                controlCount: controls.length
              }
            });
            
            return ssp;
          }),
          catchError(error => {
            this.loggerService.error('SSP generation failed', error);
            this.generationStatusSubject.next({ status: 'error', progress: 0, error });
            
            // Audit the failure
            this.auditService.logAction({
              action: 'OSCAL_SSP_GENERATION_FAILED',
              details: { 
                error: error.message,
                baselineProfile: config.baselinePath
              }
            });
            
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Save to file as Observable
  saveToFile(document: any, filename: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      try {
        const jsonContent = JSON.stringify(document, null, 2);
        
        // Use FileAPI if in browser context
        if (typeof window !== 'undefined') {
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          observer.next(true);
          observer.complete();
        } else {
          // Server-side implementation would go here
          // This uses Node.js fs module via a service
          this.configService.writeFile(filename, jsonContent)
            .subscribe({
              next: () => {
                observer.next(true);
                observer.complete();
              },
              error: (err) => observer.error(err)
            });
        }
      } catch (error) {
        this.loggerService.error('Error saving OSCAL document', error);
        observer.error(error);
      }
    });
  }

  // Convert to XML format as Observable
  convertToXml(document: any): Observable<string> {
    return this.configService.convertFormat(document, 'json', 'xml');
  }

  private buildSspDocument(components: any[], controls: any[], config: OSCALConfig): OSCALSystemSecurityPlan {
    // Implementation details...
    return {} as OSCALSystemSecurityPlan;
  }
}
```

## 4. Working with FedRAMP OSCAL Templates

The FedRAMP Program Management Office (PMO) has provided several templates in OSCAL format to help generate compliant documentation:

### Available Templates

- **System Security Plan (SSP)** template
- **Security Assessment Plan (SAP)** template
- **Security Assessment Report (SAR)** template
- **Plan of Action & Milestones (POA&M)** template

### Using Templates in ForgeBoard

```typescript
// Example: Using the FedRAMP SSP template with Observables
import { FedRAMPOSCALService } from '@forgeboard/fedramp';

@Component({
  selector: 'app-oscal-generator',
  templateUrl: './oscal-generator.component.html'
})
export class OscalGeneratorComponent implements OnInit {
  generationStatus$: Observable<GenerationStatus>;
  document$: Observable<any>;
  validationResult$: Observable<ValidationResult>;
  
  constructor(
    private oscalService: FedRAMPOSCALService,
    private loggerService: LoggerService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    // Subscribe to generation status updates
    this.generationStatus$ = this.oscalService.generationStatus$;
  }

  generateDocument(templateType: string, systemConfiguration: any) {
    // Security check before proceeding
    this.securityService.checkPermission('oscal:generate').pipe(
      take(1),
      switchMap(hasPermission => {
        if (!hasPermission) {
          this.loggerService.warn('Permission denied for OSCAL generation');
          return throwError(() => new Error('Permission denied'));
        }
        
        // Load the template
        return this.oscalService.loadTemplate(templateType).pipe(
          switchMap(template => {
            // Customize the template
            return this.oscalService.customizeTemplate(template, systemConfiguration);
          }),
          switchMap(customizedTemplate => {
            // Validate the document
            return this.oscalService.validateDocument(customizedTemplate).pipe(
              tap(validationResult => {
                this.validationResult$ = of(validationResult);
              }),
              filter(result => result.valid),
              map(() => customizedTemplate)
            );
          }),
          switchMap(validDocument => {
            // Export the document
            return this.oscalService.exportDocument(validDocument, `MySystem_${templateType.toUpperCase()}.json`);
          })
        );
      })
    ).subscribe({
      next: exportResult => {
        this.loggerService.info(`OSCAL ${templateType} document generated and exported successfully`);
      },
      error: error => {
        this.loggerService.error(`Failed to generate OSCAL ${templateType} document`, error);
      }
    });
  }
}
```

## 5. Validation Rules

ForgeBoard implements the FedRAMP validation rules to ensure compliant OSCAL documents:

### Validation Process

1. **Schema Validation**: Ensures documents conform to OSCAL schemas
2. **Schematron Validation**: Applies FedRAMP-specific rules
3. **Content Validation**: Verifies required content is present and correctly formatted

### Implementing Custom Validators

```typescript
// Example: Custom validator implementation with Observables
@Injectable()
export class CustomOSCALValidator implements OSCALValidator {
  constructor(
    private loggerService: LoggerService,
    private auditService: AuditService
  ) {}

  validate(document: any, type: string): Observable<ValidationResult> {
    this.loggerService.debug('Starting OSCAL validation', { documentType: type });
    
    // Audit the validation attempt
    this.auditService.logAction({
      action: 'OSCAL_VALIDATION_STARTED',
      details: { documentType: type }
    });
    
    return new Observable<ValidationResult>(observer => {
      try {
        // Validation logic
        const errors = [];
        
        // Check for required fields
        if (!document.metadata?.title) {
          errors.push('Missing required field: metadata.title');
        }
        
        // Run schema validation
        const schemaErrors = this.validateAgainstSchema(document, type);
        errors.push(...schemaErrors);
        
        // Run custom business rules
        const businessRuleErrors = this.validateBusinessRules(document, type);
        errors.push(...businessRuleErrors);
        
        // Return validation result
        const result: ValidationResult = {
          valid: errors.length === 0,
          errors
        };
        
        // Audit the validation result
        this.auditService.logAction({
          action: errors.length > 0 ? 'OSCAL_VALIDATION_FAILED' : 'OSCAL_VALIDATION_SUCCEEDED',
          details: { 
            documentType: type,
            errorCount: errors.length
          }
        });
        
        observer.next(result);
        observer.complete();
      } catch (error) {
        this.loggerService.error('Validation process error', error);
        
        // Audit the validation error
        this.auditService.logAction({
          action: 'OSCAL_VALIDATION_ERROR',
          details: { 
            documentType: type,
            error: error.message
          }
        });
        
        observer.error(error);
      }
    });
  }
  
  private validateAgainstSchema(document: any, type: string): string[] {
    // Schema validation implementation
    return [];
  }
  
  private validateBusinessRules(document: any, type: string): string[] {
    // Business rule validation implementation
    return [];
  }
}
```

## 6. Testing OSCAL Integration

### Unit Testing

```typescript
// Example: Unit test for OSCAL generator with RxJS
describe('OSCALGeneratorService', () => {
  let service: OSCALGeneratorService;
  let componentService: jasmine.SpyObj<ComponentService>;
  let controlService: jasmine.SpyObj<ControlService>;
  let configService: jasmine.SpyObj<ConfigurationService>;
  let loggerService: jasmine.SpyObj<LoggerService>;
  let auditService: jasmine.SpyObj<AuditService>;
  
  beforeEach(() => {
    const componentServiceSpy = jasmine.createSpyObj('ComponentService', ['getComponents']);
    const controlServiceSpy = jasmine.createSpyObj('ControlService', ['getControlImplementations']);
    const configServiceSpy = jasmine.createSpyObj('ConfigurationService', ['writeFile', 'convertFormat']);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['debug', 'error', 'info']);
    const auditServiceSpy = jasmine.createSpyObj('AuditService', ['logAction']);
    
    TestBed.configureTestingModule({
      providers: [
        OSCALGeneratorService,
        { provide: ComponentService, useValue: componentServiceSpy },
        { provide: ControlService, useValue: controlServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
        { provide: AuditService, useValue: auditServiceSpy }
      ]
    });
    
    service = TestBed.inject(OSCALGeneratorService);
    componentService = TestBed.inject(ComponentService) as jasmine.SpyObj<ComponentService>;
    controlService = TestBed.inject(ControlService) as jasmine.SpyObj<ControlService>;
    configService = TestBed.inject(ConfigurationService) as jasmine.SpyObj<ConfigurationService>;
    loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    auditService = TestBed.inject(AuditService) as jasmine.SpyObj<AuditService>;
    
    // Set up the observable return values
    componentService.getComponents.and.returnValue(of([{id: 'comp1'}]));
    controlService.getControlImplementations.and.returnValue(of([{id: 'ctrl1'}]));
    configService.writeFile.and.returnValue(of(true));
    configService.convertFormat.and.returnValue(of('<xml></xml>'));
  });
  
  it('should generate a valid SSP document', () => {
    // Set up test config
    const config: OSCALConfig = {
      baselinePath: './test-baseline.json',
      componentMappings: './test-components.json',
      controlImplementations: './test-controls.json'
    };
    
    // Subscribe to the observable and test
    service.generateSSP(config).subscribe(ssp => {
      expect(ssp).toBeDefined();
      expect(componentService.getComponents).toHaveBeenCalled();
      expect(controlService.getControlImplementations).toHaveBeenCalledWith(config.baselinePath);
      expect(auditService.logAction).toHaveBeenCalledWith(jasmine.objectContaining({
        action: 'OSCAL_SSP_GENERATION_COMPLETED'
      }));
    });
  });
  
  it('should handle errors during SSP generation', () => {
    // Set up error condition
    componentService.getComponents.and.returnValue(throwError(() => new Error('Test error')));
    
    // Set up test config
    const config: OSCALConfig = {
      baselinePath: './test-baseline.json',
      componentMappings: './test-components.json',
      controlImplementations: './test-controls.json'
    };
    
    // Subscribe to the observable and test
    service.generateSSP(config).subscribe({
      next: () => fail('Should have failed with error'),
      error: (error) => {
        expect(error).toBeDefined();
        expect(error.message).toBe('Test error');
        expect(loggerService.error).toHaveBeenCalled();
        expect(auditService.logAction).toHaveBeenCalledWith(jasmine.objectContaining({
          action: 'OSCAL_SSP_GENERATION_FAILED'
        }));
      }
    });
  });
});
```

### Integration Testing

Use the FedRAMP validation tools to verify the generated documents:

```bash
# Validate SSP using FedRAMP validation tools
npm run fedramp:validate -- --file ./output/system-security-plan.json --type ssp
```

## 7. CI/CD Integration

ForgeBoard's CI/CD pipeline includes automated OSCAL validation:

```yaml
# Example GitHub Actions workflow for OSCAL validation
name: OSCAL Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate-oscal:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate OSCAL documents
      run: npm run oscal:generate
    
    - name: Validate OSCAL documents
      run: npm run oscal:validate
```

## 8. Versioning and Release Strategy

ForgeBoard follows the FedRAMP PMO release strategy and versioning procedures:

- **OSCAL Version Support**: ForgeBoard supports OSCAL 1.0.4 and newer versions
- **Deprecation Strategy**: Older versions will be deprecated with advance notice
- **Release Tagging**: Releases are tagged with OSCAL version compatibility (e.g., `-oscal1.0.4`)

## 9. Troubleshooting Common Issues

### Schema Validation Errors

```
Problem: Documents fail schema validation
Solution: 
1. Ensure you're using the correct OSCAL version (1.0.4)
2. Check for missing required fields
3. Verify field data types match schema requirements
```

### Conversion Failures

```
Problem: OSCAL document conversion fails
Solution:
1. Verify source document structure
2. Check encoding (use UTF-8)
3. Ensure XML/JSON is well-formed
```

### Runtime Errors

```
Problem: OSCAL services throw runtime errors
Solution:
1. Check service dependencies
2. Verify configuration values
3. Look for circular dependencies
```

## 10. Contributing to OSCAL Implementation

Guidelines for contributing to ForgeBoard's OSCAL implementation:

1. **Follow Standards**: Adhere to NIST OSCAL standards and FedRAMP extensions
2. **Document Changes**: Provide clear documentation for any changes
3. **Test Thoroughly**: Include tests for all new functionality
4. **Maintain Compatibility**: Ensure backward compatibility with supported OSCAL versions

## 11. Resources

- [FedRAMP Automation Repository](https://github.com/GSA/fedramp-automation)
- [NIST OSCAL GitHub Repository](https://github.com/usnistgov/OSCAL)
- [FedRAMP OSCAL Validation Documentation](https://fedramp-gsa.github.io/validation-docs/)
- [NIST's Main OSCAL Site](https://pages.nist.gov/OSCAL/)
- [OSCAL Workshop Training Materials](https://pages.nist.gov/OSCAL/learn/presentations/)

## 8. WebSocket-based OSCAL Services

ForgeBoard provides real-time OSCAL data through WebSockets:

```typescript
// WebSocket Gateway for OSCAL data
@WebSocketGateway({ namespace: 'oscal' })
export class OSCALGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private oscalService: OSCALService,
    private securityService: SecurityService,
    private logger: LoggerService,
    private auditService: AuditService
  ) {}
  
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.info('OSCAL WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    // Verify authentication token
    const token = client.handshake.auth.token;
    
    this.securityService.validateToken(token)
      .subscribe({
        next: (user) => {
          if (user && this.securityService.hasRequiredRole(user, ['oscal-viewer', 'admin'])) {
            // Store user data on socket for later access
            client['user'] = user;
            
            // Audit successful connection
            this.auditService.logAction({
              action: 'OSCAL_WEBSOCKET_CONNECTED',
              user: user.id,
              details: {
                clientId: client.id,
                ipAddress: client.handshake.address
              }
            });
            
            this.logger.info('Client connected to OSCAL gateway', {
              userId: user.id,
              clientId: client.id
            });
          } else {
            // Unauthorized - disconnect
            this.logger.warn('Unauthorized WebSocket connection attempt', {
              clientId: client.id,
              ipAddress: client.handshake.address
            });
            
            this.auditService.logAction({
              action: 'OSCAL_WEBSOCKET_UNAUTHORIZED',
              details: {
                clientId: client.id,
                ipAddress: client.handshake.address
              }
            });
            
            client.disconnect();
          }
        },
        error: (err) => {
          this.logger.error('Error authenticating WebSocket client', {
            clientId: client.id,
            error: err.message
          });
          client.disconnect();
        }
      });
  }

  handleDisconnect(client: Socket) {
    const user = client['user'];
    if (user) {
      this.auditService.logAction({
        action: 'OSCAL_WEBSOCKET_DISCONNECTED',
        user: user.id,
        details: {
          clientId: client.id
        }
      });
    }
    
    this.logger.info('Client disconnected from OSCAL gateway', {
      clientId: client.id
    });
  }

  @SubscribeMessage('oscal:subscribe')
  handleSubscribe(client: Socket, payload: { documentId: string }): void {
    const user = client['user'];
    if (!user) return;
    
    // Audit the subscription
    this.auditService.logAction({
      action: 'OSCAL_DOCUMENT_SUBSCRIBED',
      user: user.id,
      details: {
        clientId: client.id,
        documentId: payload.documentId
      }
    });
    
    // Join a room for this document
    client.join(`document:${payload.documentId}`);
    
    // Send initial document state
    this.oscalService.getDocumentById(payload.documentId)
      .subscribe(document => {
        client.emit('oscal:update', {
          type: 'initial',
          documentId: payload.documentId,
          data: document
        });
      });
  }

  // Method to broadcast updates to subscribed clients
  broadcastUpdate(documentId: string, update: any): void {
    this.server.to(`document:${documentId}`).emit('oscal:update', {
      type: 'update',
      documentId,
      data: update,
      timestamp: new Date()
    });
  }
}
```
