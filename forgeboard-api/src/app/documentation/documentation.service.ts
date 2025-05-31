import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Observable,
  from,
  of,
  BehaviorSubject,
  throwError,
  forkJoin,
} from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DocFile } from '../interfaces/doc-file.interface';
import { DocDocument } from '../schemas/doc-document.schema';

@Injectable()
export class DocumentationService {
  private readonly logger = new Logger(DocumentationService.name);
  private docFiles$ = new BehaviorSubject<DocFile[]>([]);
  private readonly docsBasePath = path.join(process.cwd(), 'documentation');

  constructor(
    @InjectModel(DocDocument.name) private docModel: Model<DocDocument>
  ) {
    // Initialize by loading all doc files
    this.loadAllDocuments().subscribe();
  }

  /**
   * Scan all documentation files from database
   */
  scanDocumentationFiles(): Observable<DocFile[]> {
    return from(this.docModel.find().exec()).pipe(
      map((docs) =>
        docs.map((doc) => ({
          name: path.basename(doc.path),
          path: doc.path,
          title: doc.title || this.formatTitle(path.basename(doc.path)),
          category: doc.category || this.getCategoryFromPath(doc.path),
          type: doc.type || this.getFileType(doc.path),
          lastModified: doc.updatedAt?.toISOString(),
          size: doc.content?.length || 0,
        }))
      ),
      tap((files) => this.docFiles$.next(files)),
      catchError((err) => {
        this.logger.error(`Failed to scan documentation files: ${err.message}`);
        return of([]);
      })
    );
  }

  /**
   * Get all document files
   */
  getAllDocFiles(): Observable<DocFile[]> {
    return this.docFiles$.asObservable();
  }

  /**
   * Get a specific documentation file
   */
  getDocumentationFile(filePath: string): Observable<string> {
    return from(this.docModel.findOne({ path: filePath }).exec()).pipe(
      switchMap((doc) => {
        if (!doc) {
          return throwError(() => new Error(`Document not found: ${filePath}`));
        }
        return of(doc.content);
      })
    );
  }

  /**
   * Save a documentation file
   */
  saveDocumentationFile(
    filePath: string,
    content: string
  ): Observable<DocDocument> {
    // Normalize file path
    const normalizedPath = filePath.startsWith('/')
      ? filePath.substring(1)
      : filePath;

    return from(this.docModel.findOne({ path: normalizedPath }).exec()).pipe(
      switchMap((doc) => {
        if (doc) {
          // Update existing document
          doc.content = content;
          doc.updatedAt = new Date();
          return from(doc.save());
        } else {
          // Create new document
          const newDoc = new this.docModel({
            path: normalizedPath,
            title: this.formatTitle(path.basename(normalizedPath)),
            content: content,
            category: this.getCategoryFromPath(normalizedPath),
            type: this.getFileType(normalizedPath),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return from(newDoc.save());
        }
      }),
      tap(() => {
        // Refresh doc files list
        this.loadAllDocuments().subscribe();
      })
    );
  }

  /**
   * Delete a documentation file
   */
  deleteDocumentationFile(filePath: string): Observable<boolean> {
    return from(this.docModel.deleteOne({ path: filePath }).exec()).pipe(
      map((result) => result.deletedCount > 0),
      tap((success) => {
        if (success) {
          // Refresh doc files list
          this.loadAllDocuments().subscribe();
        }
      })
    );
  }

  /**
   * Load all documents from database
   */
  private loadAllDocuments(): Observable<DocFile[]> {
    return this.scanDocumentationFiles();
  }

  /**
   * Seed documentation from filesystem into database
   */
  seedDocumentation(): Observable<DocFile[]> {
    return from(this.scanFileSystem(this.docsBasePath)).pipe(
      switchMap((files) => {
        if (files.length === 0) {
          return of([]);
        }

        // Create an array of observables for each file to be seeded
        const seedObservables = files.map((file) => this.seedSingleFile(file));

        // Process all files in parallel with forkJoin
        return forkJoin(seedObservables).pipe(
          catchError((err) => {
            this.logger.error(`Error seeding documentation: ${err.message}`);
            return of([]);
          })
        );
      }),
      switchMap(() => this.loadAllDocuments())
    );
  }

  /**
   * Scan file system for documentation files
   */
  private async scanFileSystem(
    dir: string,
    base = ''
  ): Promise<{ path: string; fullPath: string }[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const results = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(base, entry.name);

          if (entry.isDirectory()) {
            return this.scanFileSystem(fullPath, relativePath);
          } else {
            // Only include documentation file types
            const ext = path.extname(entry.name).toLowerCase();
            if (
              [
                '.md',
                '.markdown',
                '.pdf',
                '.wav',
                '.mp3',
                '.jpg',
                '.png',
                '.svg',
              ].includes(ext)
            ) {
              return [{ path: relativePath, fullPath }];
            }
            return [];
          }
        })
      );

      return results.flat();
    } catch (err) {
      this.logger.error(`Error scanning directory ${dir}: ${err.message}`);
      return [];
    }
  }

  /**
   * Seed a single file into the database
   */
  private seedSingleFile(file: {
    path: string;
    fullPath: string;
  }): Observable<DocDocument | null> {
    return from(fs.readFile(file.fullPath, 'utf8')).pipe(
      switchMap((content) => {
        const normalizedPath = file.path.replace(/\\/g, '/');

        return from(
          this.docModel.findOne({ path: normalizedPath }).exec()
        ).pipe(
          switchMap((existingDoc) => {
            if (existingDoc) {
              return of(existingDoc);
            }

            const newDoc = new this.docModel({
              path: normalizedPath,
              title: this.formatTitle(path.basename(normalizedPath)),
              content: content,
              category: this.getCategoryFromPath(normalizedPath),
              type: this.getFileType(normalizedPath),
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            return from(newDoc.save());
          })
        );
      }),
      catchError((err) => {
        this.logger.error(`Failed to seed file ${file.path}: ${err.message}`);
        return of(null);
      })
    );
  }

  /**
   * Format file name as title
   */
  private formatTitle(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.[^/.]+$/, '');
    // Replace dashes and underscores with spaces
    title = title.replace(/[_-]/g, ' ');
    // Title case
    return title
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract category from file path
   */
  private getCategoryFromPath(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');

    if (parts.length <= 1) {
      return 'general';
    }

    return parts[0].toLowerCase();
  }

  /**
   * Determine file type based on extension
   */
  private getFileType(
    filename: string
  ): 'markdown' | 'pdf' | 'audio' | 'image' | 'other' {
    const extension = path.extname(filename).toLowerCase();

    if (['.md', '.markdown'].includes(extension)) return 'markdown';
    if (extension === '.pdf') return 'pdf';
    if (['.mp3', '.wav', '.ogg'].includes(extension)) return 'audio';
    if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(extension))
      return 'image';
    return 'other';
  }
}
