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

  constructor(private readonly logger: LoggerService) {}

  getDocuments(): Observable<OscalDocument[]> {
    this.logger.info('Retrieving all OSCAL documents', 'OscalService');
    return of(this.documents);
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

  // This method would be called when a document is updated elsewhere in the system
  notifyDocumentUpdate(update: OscalDocumentUpdate): void {
    this.logger.info(`Document updated: ${update.documentId}`, 'OscalService', { updateType: update.updateType });
    this.documentUpdatesSubject.next(update);
  }
}
