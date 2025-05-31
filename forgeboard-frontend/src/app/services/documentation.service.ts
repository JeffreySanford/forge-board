import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DocFile {
  name: string;
  path: string;
  title: string;
  category?: string;
  lastModified?: string;
  isDirectory?: boolean;
  type?: 'markdown' | 'pdf' | 'audio' | 'image' | 'other';
  size?: number;
}

export interface DocCategory {
  name: string;
  title: string;
  files: DocFile[];
}

export type DocSource = 'frontend' | 'backend' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class DocumentationService {
  private readonly docRootPath = 'assets/documentation/';
  private readonly projectReadmePath = 'assets/documentation/README.md';
  private docFiles$: BehaviorSubject<DocFile[]> = new BehaviorSubject<
    DocFile[]
  >([]);
  private docCategories$: BehaviorSubject<DocCategory[]> = new BehaviorSubject<
    DocCategory[]
  >([]);
  private docSource$: BehaviorSubject<DocSource> =
    new BehaviorSubject<DocSource>('auto');

  // API endpoint configuration
  private readonly apiBaseUrl =
    environment.apiBaseUrl || 'http://localhost:3000';
  private readonly apiDocEndpoint = `${this.apiBaseUrl}/api/docs`;

  // Cache for API responses
  private documentCache = new Map<
    string,
    { content: string; timestamp: number }
  >();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {
    this.initializeDocumentation();
  }

  /**
   * Initialize documentation by scanning files or loading from static list
   */
  private initializeDocumentation(): void {
    this.scanAllDocumentationFiles().subscribe();
  }

  /**
   * Set the documentation source
   */
  setDocumentationSource(source: DocSource): void {
    this.docSource$.next(source);
    // Rescan with new source
    this.scanAllDocumentationFiles().subscribe();
  }

  /**
   * Get the current documentation source
   */
  getDocumentationSource(): Observable<DocSource> {
    return this.docSource$.asObservable();
  }

  /**
   * Scan for all documentation files from backend API or frontend assets
   */
  public scanAllDocumentationFiles(): Observable<DocFile[]> {
    const source = this.docSource$.getValue();

    // If forced to frontend, skip API
    if (source === 'frontend') {
      return this.scanFrontendDocumentation();
    }

    // Try backend first (or if forced to backend)
    return this.http
      .get<{ files: DocFile[]; storageType: string }>(
        `${this.apiDocEndpoint}/scan`
      )
      .pipe(
        tap((response) => {
          const files = response.files;

          // Make sure file types are set
          files.forEach((file) => {
            if (!file.type) {
              file.type = this.determineFileType(file.name);
            }
          });

          this.docFiles$.next(files);
          this.docCategories$.next(this.organizeFilesIntoCategories(files));
        }),
        map((response) => response.files),
        catchError((error) => {
          // If auto mode, fall back to frontend
          if (source === 'auto') {
            console.warn(
              'Backend documentation API not available, falling back to frontend assets'
            );
            return this.scanFrontendDocumentation();
          }

          // If backend was explicitly requested but failed
          console.error('Failed to load backend documentation:', error);
          return of([]);
        })
      );
  }

  /**
   * Scan frontend static documentation files
   */
  private scanFrontendDocumentation(): Observable<DocFile[]> {
    return this.http
      .get<{ files: DocFile[] }>(this.docRootPath + 'index.json')
      .pipe(
        map((response) => {
          const files = response.files;

          // Add file types
          files.forEach((file) => {
            file.type = this.determineFileType(file.name);
          });

          this.docFiles$.next(files);
          this.docCategories$.next(this.organizeFilesIntoCategories(files));
          return files;
        }),
        catchError(() => {
          // Use hardcoded list as last fallback
          console.warn('Using hardcoded document list fallback');
          const files = this.getHardcodedDocList();
          this.docFiles$.next(files);
          this.docCategories$.next(this.organizeFilesIntoCategories(files));
          return of(files);
        })
      );
  }

  /**
   * Get documentation content based on current source settings
   */
  public getDocumentContent(file: DocFile): Observable<any> {
    const source = this.docSource$.getValue();
    const path = file.path;

    // For non-markdown files, just return the path
    if (file.type !== 'markdown') {
      return of(path);
    }

    // For markdown files, load the content
    if (source === 'frontend') {
      return this.getDocumentationByPath(path);
    }

    // Try backend first
    return this.getDocumentationFromApi(path).pipe(
      catchError((error) => {
        if (source === 'auto') {
          // Fall back to frontend if in auto mode
          console.warn(`Backend document not found: ${path}, trying frontend`);
          return this.getDocumentationByPath(path);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get documentation from API
   */
  public getDocumentationFromApi(path: string): Observable<string> {
    // Check cache first
    const cachedDoc = this.documentCache.get(path);
    if (cachedDoc && Date.now() - cachedDoc.timestamp < this.cacheDuration) {
      console.log(`Using cached documentation for: ${path}`);
      return of(cachedDoc.content);
    }

    // Format the API URL
    const apiUrl = `${this.apiDocEndpoint}/${path.replace(/^\/+/, '')}`;

    return this.http.get(apiUrl, { responseType: 'text' }).pipe(
      tap((content) => {
        // Cache the response
        this.documentCache.set(path, {
          content,
          timestamp: Date.now(),
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn(`API documentation fetch failed for ${path}`);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get documentation from frontend assets
   */
  public getDocumentationByPath(path: string): Observable<string> {
    // Fix double slash issue by ensuring proper path join
    const fullPath = path.startsWith('assets/')
      ? path
      : this.docRootPath + (path.startsWith('/') ? path.substring(1) : path);

    return this.http.get(fullPath, { responseType: 'text' }).pipe(
      catchError((err) => {
        console.warn(`Documentation file not found: ${path}`);
        return of(
          `# Documentation Not Available\n\nThe requested documentation file at path: **${path}** is not currently available.`
        );
      })
    );
  }

  /**
   * Organize files into categories based on directory structure
   */
  private organizeFilesIntoCategories(files: DocFile[]): DocCategory[] {
    const categories = new Map<string, DocCategory>();
    // Root README as its own category
    const rootFiles = files.filter((f) => f.category === 'root');
    if (rootFiles.length) {
      categories.set('root', {
        name: 'root',
        title: 'Project Overview',
        files: rootFiles,
      });
    }
    files.forEach((file) => {
      if (file.category && file.category !== 'root') {
        if (!categories.has(file.category)) {
          categories.set(file.category, {
            name: file.category,
            title: this.formatCategoryTitle(file.category),
            files: [],
          });
        }
        const cat = categories.get(file.category);
        if (cat) {
          cat.files.push(file);
        }
      }
    });
    // Add uncategorized files to 'General'
    const generalFiles = files.filter(
      (f) => !f.category && f.path !== this.projectReadmePath
    );
    if (generalFiles.length) {
      categories.set('general', {
        name: 'general',
        title: 'General Documentation',
        files: generalFiles,
      });
    }
    return Array.from(categories.values());
  }

  /**
   * Format a category title from its name
   */
  private formatCategoryTitle(category: string): string {
    return category
      .split(/[/-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get list of all documentation files
   */
  getDocumentationList(): Observable<DocFile[]> {
    return this.docFiles$.asObservable();
  }

  /**
   * Get organized document categories
   */
  getDocumentationCategories(): Observable<DocCategory[]> {
    return this.docCategories$.asObservable();
  }

  /**
   * Determine file type based on extension
   */
  private determineFileType(
    filename: string
  ): 'markdown' | 'pdf' | 'audio' | 'image' | 'other' {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (['md', 'markdown'].includes(extension)) return 'markdown';
    if (extension === 'pdf') return 'pdf';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension))
      return 'image';
    return 'other';
  }

  /**
   * Get hardcoded document list as final fallback
   */
  private getHardcodedDocList(): DocFile[] {
    return [
      {
        name: 'README.md',
        path: this.projectReadmePath,
        title: 'Project Overview',
        category: 'root',
        type: 'markdown',
      },
      // Example of a PDF file
      {
        name: 'security-whitepaper.pdf',
        path: this.docRootPath + 'security/security-whitepaper.pdf',
        title: 'Security Whitepaper',
        category: 'security',
        type: 'pdf',
      },
      // Example of an audio file
      {
        name: 'feature-overview.wav',
        path: this.docRootPath + 'presentations/feature-overview.wav',
        title: 'Feature Overview Audio',
        category: 'presentations',
        type: 'audio',
      },
    ];
  }

  /**
   * Clear documentation cache
   */
  clearCache(): void {
    this.documentCache.clear();
    console.log('Documentation cache cleared');
  }
}
