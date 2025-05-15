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
  errors?: Array<{ code: string; message: string; path?: string }>;
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
  private templates = [
    { id: 'template-ssp', type: 'ssp', title: 'System Security Plan Template' },
    { id: 'template-poam', type: 'poam', title: 'Plan of Action & Milestones Template' }
  ];
  
  // Mock baselines
  private baselines = [
    { id: 'baseline-low', title: 'FedRAMP Low Impact Baseline', version: '2.0' },
    { id: 'baseline-moderate', title: 'FedRAMP Moderate Impact Baseline', version: '2.0' },
    { id: 'baseline-high', title: 'FedRAMP High Impact Baseline', version: '2.0' }
  ];

  constructor(private readonly logger: LoggerService) {}

  getDocuments(type?: string, limit?: number, offset?: number): Observable<OscalDocument[]> {
    this.logger.info('Retrieving OSCAL documents', 'OscalService');
    let filtered = [...this.documents];
    
    // Apply type filter if specified
    if (type) {
      filtered = filtered.filter(doc => doc.documentType === type);
    }
    
    // Apply pagination if specified
    if (offset !== undefined && limit !== undefined) {
      const startIndex = offset;
      const endIndex = offset + limit;
      filtered = filtered.slice(startIndex, endIndex);
    }
    
    return of(filtered);
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
    // Mock validation - in real implementation would perform actual validation
    return of({
      valid: true,
      errors: [] // Empty array means no validation errors
    });
  }

  getTemplates(): Observable<any[]> {
    this.logger.info('Retrieving OSCAL templates', 'OscalService');
    return of(this.templates);
  }

  getTemplateByType(type: string): Observable<any> {
    this.logger.info(`Retrieving OSCAL template for type: ${type}`, 'OscalService');
    const template = this.templates.find(t => t.type === type);
    return of(template || null);
  }

  getBaselines(): Observable<any[]> {
    this.logger.info('Retrieving OSCAL baselines', 'OscalService');
    return of(this.baselines);
  }

  // This method would be called when a document is updated elsewhere in the system
  notifyDocumentUpdate(update: OscalDocumentUpdate): void {
    this.logger.info(`Document updated: ${update.documentId}`, 'OscalService');
    this.documentUpdatesSubject.next(update);
  }
}
