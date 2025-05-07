import { Injectable } from '@nestjs/common';
import { Observable, of, Subject } from 'rxjs';
import { LoggerService } from '../common/logger.service';

export interface OscalDocument {
  documentId: string;
  documentType: string;
  metadata: {
    title: string;
    version: string;
    lastModified: string | Date;
  };
  content: Record<string, unknown>;
}

export interface OscalDocumentUpdate {
  documentId: string;
  updateType: string;
  timestamp: Date;
  changes?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    message: string;
    path?: string;
    severity?: string;
  }>;
}

export interface OscalTemplate {
  templateType: string;
  name: string;
  description?: string;
  structure: Record<string, unknown>;
}

export interface OscalBaseline {
  baselineId: string;
  name: string;
  description?: string;
  controls: string[];
}

@Injectable()
export class OscalService {
  // Observable for document updates
  private readonly documentUpdatesSubject = new Subject<OscalDocumentUpdate>();
  public readonly oscalDocumentUpdates$ = this.documentUpdatesSubject.asObservable();
  
  // Mock data
  private documents: OscalDocument[] = [
    {
      documentId: 'doc-001',
      documentType: 'ssp',
      metadata: {
        title: 'System Security Plan',
        version: '1.0.0',
        lastModified: new Date(),
      },
      content: {
        // Document content would go here
        sections: []
      }
    },
    {
      documentId: 'doc-002',
      documentType: 'poam',
      metadata: {
        title: 'Plan of Action & Milestones',
        version: '1.2.0',
        lastModified: new Date(),
      },
      content: {
        // Document content would go here
        items: []
      }
    }
  ];

  // Mock templates
  private templates: OscalTemplate[] = [
    {
      templateType: 'ssp',
      name: 'System Security Plan Template',
      description: 'Standard template for SSP documents',
      structure: { /* template structure */ }
    },
    {
      templateType: 'poam',
      name: 'Plan of Action & Milestones Template',
      description: 'Standard template for POA&M documents',
      structure: { /* template structure */ }
    }
  ];

  // Mock baselines
  private baselines: OscalBaseline[] = [
    {
      baselineId: 'baseline-001',
      name: 'FedRAMP Low',
      description: 'Federal Risk and Authorization Management Program Low Impact Baseline',
      controls: ['AC-1', 'AC-2', 'AU-1', 'AU-2']
    },
    {
      baselineId: 'baseline-002',
      name: 'FedRAMP Moderate',
      description: 'Federal Risk and Authorization Management Program Moderate Impact Baseline',
      controls: ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AU-1', 'AU-2', 'AU-3']
    }
  ];

  constructor(private readonly logger: LoggerService) {}

  getDocuments(type?: string, limit?: number, offset?: number): Observable<OscalDocument[]> {
    this.logger.info('Retrieving OSCAL documents', 'OscalService', { type, limit, offset });
    
    let filteredDocs = [...this.documents];
    
    // Apply type filter if provided
    if (type) {
      filteredDocs = filteredDocs.filter(doc => doc.documentType === type);
    }
    
    // Apply pagination if provided
    if (limit !== undefined || offset !== undefined) {
      const startIndex = offset || 0;
      const endIndex = limit ? startIndex + limit : filteredDocs.length;
      filteredDocs = filteredDocs.slice(startIndex, endIndex);
    }
    
    return of(filteredDocs);
  }

  getDocumentById(id: string): Observable<OscalDocument | null> {
    this.logger.info(`Retrieving OSCAL document: ${id}`, 'OscalService');
    const document = this.documents.find(doc => doc.documentId === id);
    return of(document || null);
  }

  getDocumentAsXml(id: string): Observable<string> {
    this.logger.info(`Converting OSCAL document to XML: ${id}`, 'OscalService');
    // In a real implementation, you would convert the document to XML
    return of(`<oscal-document id="${id}"><metadata><title>Mock XML Document</title></metadata></oscal-document>`);
  }

  validateDocument(id: string): Observable<ValidationResult> {
    this.logger.info(`Validating OSCAL document: ${id}`, 'OscalService');
    // Simple mock validation - in reality this would perform schema validation
    const document = this.documents.find(doc => doc.documentId === id);
    
    if (!document) {
      return of({
        valid: false,
        errors: [{
          message: `Document with ID ${id} not found`
        }]
      });
    }
    
    // Mock validation result - always valid for our mock data
    return of({
      valid: true,
      errors: []
    });
  }

  getTemplates(): Observable<OscalTemplate[]> {
    this.logger.info('Retrieving OSCAL templates', 'OscalService');
    return of(this.templates);
  }

  getTemplateByType(type: string): Observable<OscalTemplate | null> {
    this.logger.info(`Retrieving OSCAL template by type: ${type}`, 'OscalService');
    const template = this.templates.find(t => t.templateType === type);
    return of(template || null);
  }

  getBaselines(): Observable<OscalBaseline[]> {
    this.logger.info('Retrieving OSCAL baselines', 'OscalService');
    return of(this.baselines);
  }

  // This method would be called when a document is updated elsewhere in the system
  notifyDocumentUpdate(update: OscalDocumentUpdate): void {
    this.logger.info(`Document updated: ${update.documentId}`, 'OscalService', { updateType: update.updateType });
    this.documentUpdatesSubject.next(update);
  }
}
