import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DocFile {
  name: string;
  path: string;
  title: string;
  category?: string;
  lastModified?: string;
  isDirectory?: boolean;
}

export interface DocCategory {
  name: string;
  title: string;
  files: DocFile[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentationService {
  private readonly basePath = 'assets/documentation/';
  private docFiles: DocFile[] = [];
  private docCategories: DocCategory[] = [];
  private initialized = false;

  constructor(private http: HttpClient) {
    // Initialize on service creation
    this.initializeDocumentation();
  }
  /**
   * Initialize documentation by loading index or scanning directory
   */
  private initializeDocumentation(): void {
    // Try to fetch the documentation index first
    this.http
      .get<{ files: DocFile[]; categories: DocCategory[] }>(
        `${this.basePath}index.json`
      )
      .pipe(
        catchError(() => {
          // If index.json doesn't exist, load a static list for now
          // In a production environment, we would generate this index during build
          // or have the backend generate it dynamically
          const staticFiles: DocFile[] = [
            {
              name: 'FRONTEND-API-ARCHITECTURE.md',
              path: 'FRONTEND-API-ARCHITECTURE.md',
              title: 'Frontend-API Architecture',
            },
            { name: 'LAYOUT.md', path: 'LAYOUT.md', title: 'Layout System' },
            {
              name: 'VISUAL-STANDARDS.md',
              path: 'VISUAL-STANDARDS.md',
              title: 'Visual Standards',
            },
            {
              name: 'API-DOCUMENTATION.md',
              path: 'API-DOCUMENTATION.md',
              title: 'API Documentation',
            },
            {
              name: 'AUTHENTICATION.md',
              path: 'AUTHENTICATION.md',
              title: 'Authentication',
            },
            {
              name: 'CODING-STANDARDS.md',
              path: 'CODING-STANDARDS.md',
              title: 'Coding Standards',
            },
            {
              name: 'TEST-PATTERNS.md',
              path: 'TEST-PATTERNS.md',
              title: 'Test Patterns',
            },
            {
              name: 'EXCEEDING-STANDARDS.md',
              path: 'EXCEEDING-STANDARDS.md',
              title: 'Exceeding Standards Playbook',
            },
            {
              name: 'PROJECT-STATUS.md',
              path: 'PROJECT-STATUS.md',
              title: 'Project Status Report',
            },

            // Add known subdirectories
            {
              name: 'developer',
              path: 'developer/',
              title: 'Developer Guides',
              isDirectory: true,
            },
            {
              name: 'security',
              path: 'security/',
              title: 'Security Documentation',
              isDirectory: true,
            },
            {
              name: 'fedramp',
              path: 'fedramp/',
              title: 'FedRAMP Documentation',
              isDirectory: true,
            },
            {
              name: 'marketing',
              path: 'marketing/',
              title: 'Marketing Material',
              isDirectory: true,
            },
            {
              name: 'small-business',
              path: 'small-business/',
              title: 'Small Business',
              isDirectory: true,
            },

            // Add specific FedRAMP document files
            {
              name: 'PILLAR_MATRIX_DECONSTRUCTED.md',
              path: 'fedramp/PILLAR_MATRIX_DECONSTRUCTED.md',
              title: 'Pillar-to-Doc Matrix Deconstructed',
              category: 'fedramp',
            },
            {
              name: 'FEDRAMP_DEPLOYMENT_CONSIDERATIONS.md',
              path: 'fedramp/FEDRAMP_DEPLOYMENT_CONSIDERATIONS.md',
              title: 'FedRAMP Deployment Considerations',
              category: 'fedramp',
            },
          ];

          return of({ files: staticFiles, categories: [] });
        })
      )
      .subscribe((data) => {
        this.docFiles = data.files;
        this.docCategories = data.categories;
        this.initialized = true;

        // Organize files into categories if categories are empty
        if (data.categories.length === 0) {
          this.organizeFilesIntoCategories();
        }
      });
  }

  /**
   * Organize files into categories based on path or naming conventions
   */
  private organizeFilesIntoCategories(): void {
    const categories = new Map<string, DocCategory>();

    // Create "General" category for root files
    categories.set('general', {
      name: 'general',
      title: 'General Documentation',
      files: [],
    });

    // Process each file
    this.docFiles.forEach((file) => {
      if (file.isDirectory) {
        // Create a category for each directory
        categories.set(file.name, {
          name: file.name,
          title: file.title,
          files: [],
        });
      } else {
        // Determine category from path
        const path = file.path;
        const category = path.includes('/') ? path.split('/')[0] : 'general';

        if (!categories.has(category) && category !== 'general') {
          categories.set(category, {
            name: category,
            title: this.formatCategoryTitle(category),
            files: [],
          });
        }

        // Add to appropriate category
        if (path.includes('/') && categories.has(category)) {
          const categoryObj = categories.get(category);
          if (categoryObj) {
            categoryObj.files.push(file);
          }
        } else {
          const generalCategory = categories.get('general');
          if (generalCategory) {
            generalCategory.files.push(file);
          }
        }
      }
    });

    this.docCategories = Array.from(categories.values());
  }

  /**
   * Format category name to title
   */
  private formatCategoryTitle(category: string): string {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get a list of all available documentation files
   */
  getDocumentationList(): Observable<DocFile[]> {
    if (!this.initialized) {
      return new Observable<DocFile[]>((observer) => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            observer.next(this.docFiles);
            observer.complete();
          }
        }, 100);

        // Safety timeout
        setTimeout(() => {
          if (!observer.closed) {
            clearInterval(checkInterval);
            observer.next([]);
            observer.complete();
          }
        }, 5000);
      });
    }

    return of(this.docFiles);
  }

  /**
   * Get all documentation categories
   */
  getDocumentationCategories(): Observable<DocCategory[]> {
    if (!this.initialized) {
      return new Observable<DocCategory[]>((observer) => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            observer.next(this.docCategories);
            observer.complete();
          }
        }, 100);

        // Safety timeout
        setTimeout(() => {
          if (!observer.closed) {
            clearInterval(checkInterval);
            observer.next([]);
            observer.complete();
          }
        }, 5000);
      });
    }

    return of(this.docCategories);
  }

  /**
   * Get documentation file content by filename
   */
  getDocumentationByName(filename: string): Observable<string> {
    const path = this.basePath + filename;
    return this.http.get(path, { responseType: 'text' }).pipe(
      catchError((err) => {
        console.error(`Failed to load documentation file: ${filename}`, err);
        return of(
          `# Error Loading Documentation\n\nUnable to load the requested documentation file: **${filename}**.\n\nPlease check that the file exists in the assets/documentation directory.`
        );
      })
    );
  }

  /**
   * Get documentation file content by path
   */
  getDocumentationByPath(path: string): Observable<string> {
    const fullPath = path.startsWith(this.basePath)
      ? path
      : this.basePath + path;
    return this.http.get(fullPath, { responseType: 'text' }).pipe(
      catchError((err) => {
        console.error(`Failed to load documentation file: ${path}`, err);
        return of(
          `# Error Loading Documentation\n\nUnable to load the requested documentation file at path: **${path}**.\n\nPlease check that the file exists in the assets/documentation directory.`
        );
      })
    );
  }

  /**
   * Get files in a specific category
   */
  getFilesInCategory(category: string): Observable<DocFile[]> {
    return this.getDocumentationCategories().pipe(
      map((categories) => {
        const foundCategory = categories.find((c) => c.name === category);
        return foundCategory ? foundCategory.files : [];
      })
    );
  }
}
