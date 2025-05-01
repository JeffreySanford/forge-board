import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProjectConfig {
  name: string;
  prefix?: string;
  version?: string;
  description?: string;
}

// Define environment interface directly before use
interface Environment {
  production: boolean;
  apiBaseUrl: string;
  socketBaseUrl: string;
  project?: ProjectConfig;
}

// Type assertion with the interface
const typedEnvironment = environment as Environment;

@Injectable({
  providedIn: 'root'
})
export class ProjectConfigService {
  // Use environment.project directly without hardcoded defaults
  private projectConfig: ProjectConfig;
  private projectConfigSubject: BehaviorSubject<ProjectConfig>;

  constructor() {
    // Initialize with environment project configuration - safely accessing the optional property
    this.projectConfig = typedEnvironment.project || {
      name: 'ForgeBoard'
    };
    
    // Initialize subject with proper configuration
    this.projectConfigSubject = new BehaviorSubject<ProjectConfig>(this.projectConfig);
    
    // Load any additional configurations if needed
    this.loadProjectConfig().catch(err => 
      console.error('Failed to load additional project config:', err)
    );
  }

  getProjectConfig(): Observable<ProjectConfig> {
    return this.projectConfigSubject.asObservable();
  }

  getProjectName(): Observable<string> {
    return new Observable<string>(observer => {
      this.projectConfigSubject.subscribe(config => {
        if (config?.prefix) {
          observer.next(`${config.prefix}: ${config.name}`);
        } else if (config?.name) {
          observer.next(config.name);
        } else {
          // Only use a fallback if absolutely necessary
          observer.next('ForgeBoard');
        }
      });
    });
  }

  updateProjectConfig(config: Partial<ProjectConfig>): void {
    this.projectConfig = { ...this.projectConfig, ...config };
    this.projectConfigSubject.next(this.projectConfig);
  }

  // This method can be used to load project config from a JSON file or API
  loadProjectConfig(): Promise<void> {
    // This could fetch from a local JSON file or API endpoint in the future
    return Promise.resolve();
  }
}
