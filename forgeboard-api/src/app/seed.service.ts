import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BehaviorSubject, Observable, Subject, from, of, concat } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { User } from './models/user.model';
import { Log } from './models/log.model';
import { Metric } from './models/metric.model';
import { Diagnostic } from './models/diagnostic.model';
import { KanbanBoard } from './models/kanban.model';
import { Sound } from './models/sound.model';
import * as fs from 'fs';
import * as path from 'path';

// Define seed operation statuses
export enum SeedOperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

// Define a status model for seed operations
export interface SeedOperationState {
  operation: string;
  status: SeedOperationStatus;
  message: string;
  startTime?: Date;
  endTime?: Date;
  count?: number;
  error?: string;
}

// Define overall seeding status
export interface SeedStatus {
  overall: SeedOperationStatus;
  operations: SeedOperationState[];
  startTime: Date;
  endTime?: Date;
  totalSeeded: number;
  errors: number;
}

const SEED_DATA_DIR = path.join(__dirname, 'seed');
const KANBAN_EXAMPLE_FILE = path.join(SEED_DATA_DIR, 'kanban-example-boards.json');
const KANBAN_FORGEBOARD_FILE = path.join(SEED_DATA_DIR, 'kanban-forgeboard-stories.json');

function loadSeedJson(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to load seed file: ${filePath} - ${e.message}`);
  }
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private readonly destroy$ = new Subject<void>();
  
  // Status subjects for observing seeding operations
  private readonly statusSubject = new BehaviorSubject<SeedStatus>({
    overall: SeedOperationStatus.PENDING,
    operations: [],
    startTime: new Date(),
    totalSeeded: 0,
    errors: 0
  });
  
  // Expose public observable for status
  public readonly status$ = this.statusSubject.asObservable();

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(Metric.name) private metricModel: Model<Metric>,
    @InjectModel(Diagnostic.name) private diagnosticModel: Model<Diagnostic>,
    @InjectModel(KanbanBoard.name) private kanbanBoardModel: Model<KanbanBoard>,
    @InjectModel(Sound.name) private soundModel: Model<Sound>,
  ) {}

  onModuleInit() {
    if (process.env.USE_IN_MEMORY_MONGO === 'true') {
      this.seedDatabase().subscribe({
        complete: () => {
          const currentStatus = this.statusSubject.getValue();
          this.statusSubject.next({
            ...currentStatus,
            overall: 
              currentStatus.errors > 0 
              ? SeedOperationStatus.FAILED 
              : SeedOperationStatus.SUCCESS,
            endTime: new Date(),
          });
          this.logger.log(`In-memory MongoDB seeded with ${currentStatus.totalSeeded} records. Status: ${currentStatus.overall}`);
        }
      });
    }
  }

  /**
   * Main method to seed the database using observables
   * Returns an observable that completes when all seeding is done
   */
  public seedDatabase(): Observable<void> {
    // Update status to in progress
    this.updateStatus({
      overall: SeedOperationStatus.IN_PROGRESS,
      operations: [],
      startTime: new Date(),
      totalSeeded: 0,
      errors: 0
    });
    
    // Chain all seeding operations
    return concat(
      this.seedUsers(),
      this.seedLogs(),
      this.seedMetrics(),
      this.seedDiagnostics(),
      this.seedKanbanBoards(),
      this.seedSounds()
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        // Ensure we always update the end time
        const currentStatus = this.statusSubject.getValue();
        if (!currentStatus.endTime) {
          this.statusSubject.next({
            ...currentStatus,
            endTime: new Date()
          });
        }
      }),
      // Convert to void
      map(() => undefined)
    );
  }

  /**
   * Seed users collection
   */
  private seedUsers(): Observable<SeedOperationState> {
    const operationName = 'Users';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding users...',
      startTime: new Date()
    });
    
    return from(this.userModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        const users = [
          { username: 'admin', password: 'admin', role: 'admin' },
          { username: 'user', password: 'user', role: 'user' },
        ];
        
        return from(this.userModel.create(users)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} ${operationName.toLowerCase()}`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed ${operationName.toLowerCase()}:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Seed logs collection
   */
  private seedLogs(): Observable<SeedOperationState> {
    const operationName = 'Logs';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding logs...',
      startTime: new Date()
    });
    
    return from(this.logModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        const logs = [
          { level: 'info', message: 'System started', timestamp: new Date(), source: 'system' },
          { level: 'error', message: 'Sample error', timestamp: new Date(), source: 'system' },
        ];
        
        return from(this.logModel.create(logs)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} ${operationName.toLowerCase()}`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed ${operationName.toLowerCase()}:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Seed metrics collection
   */
  private seedMetrics(): Observable<SeedOperationState> {
    const operationName = 'Metrics';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding metrics...',
      startTime: new Date()
    });
    
    return from(this.metricModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        const metrics = [
          { type: 'cpu', value: 0.5, timestamp: new Date(), cpu: 0.5 },
          { type: 'memory', value: 0.7, timestamp: new Date(), memory: 0.7 },
        ];
        
        return from(this.metricModel.create(metrics)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} ${operationName.toLowerCase()}`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed ${operationName.toLowerCase()}:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Seed diagnostics collection
   */
  private seedDiagnostics(): Observable<SeedOperationState> {
    const operationName = 'Diagnostics';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding diagnostics...',
      startTime: new Date()
    });
    
    return from(this.diagnosticModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        const diagnostics = [
          { type: 'startup', eventType: 'info', timestamp: new Date(), source: 'system', message: 'Diagnostics started' },
        ];
        
        return from(this.diagnosticModel.create(diagnostics)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} ${operationName.toLowerCase()}`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed ${operationName.toLowerCase()}:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed ${operationName.toLowerCase()}`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Seed kanban boards collection
   */
  private seedKanbanBoards(): Observable<SeedOperationState> {
    const operationName = 'Kanban Boards';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding kanban boards...',
      startTime: new Date()
    });
    
    return from(this.kanbanBoardModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        // Load both example and forgeboard stories
        let boards: any[] = [];
        try {
          const exampleBoards = loadSeedJson(KANBAN_EXAMPLE_FILE);
          const forgeboardBoards = loadSeedJson(KANBAN_FORGEBOARD_FILE);
          boards = [...exampleBoards, ...forgeboardBoards];
        } catch (e) {
          this.logger.error(`Failed to load kanban board mock files: ${e.message}`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.FAILED,
            message: `Failed to load kanban board mock files`,
            startTime: new Date(),
            endTime: new Date(),
            error: e.message
          });
        }
        return from(this.kanbanBoardModel.create(boards)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} kanban boards`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} kanban boards`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed kanban boards:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed kanban boards`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Seed sounds collection
   */
  private seedSounds(): Observable<SeedOperationState> {
    const operationName = 'Sounds';
    
    // Update status to show operation is in progress
    this.updateOperationStatus({
      operation: operationName,
      status: SeedOperationStatus.IN_PROGRESS,
      message: 'Seeding sounds...',
      startTime: new Date()
    });
    
    return from(this.soundModel.countDocuments()).pipe(
      switchMap(count => {
        if (count > 0) {
          this.logger.log(`Skipping ${operationName} seed - collection already has data`);
          return of({
            operation: operationName,
            status: SeedOperationStatus.SKIPPED,
            message: `${operationName} collection already has ${count} documents`,
            startTime: new Date(),
            endTime: new Date(),
            count
          });
        }
        
        // Define essential sounds
        const essentialSounds = {
          typewriter: ['key.mp3', 'ding.mp3'],
          // Add more categories as needed
        };
        
        // Create sound documents
        const soundDocs = [];
        
        for (const [category, files] of Object.entries(essentialSounds)) {
          for (const file of files as string[]) {
            soundDocs.push({
              category,
              filename: file,
              path: `assets/sounds/${category}/${file}`,
              required: true,
              exists: false, // Default to false until verified
              created: new Date(),
            });
          }
        }
        
        return from(this.soundModel.insertMany(soundDocs)).pipe(
          map(result => {
            const createdCount = Array.isArray(result) ? result.length : 1;
            this.logger.log(`Seeded ${createdCount} sound documents`);
            return {
              operation: operationName,
              status: SeedOperationStatus.SUCCESS,
              message: `Successfully seeded ${createdCount} sound documents`,
              startTime: new Date(),
              endTime: new Date(),
              count: createdCount
            };
          }),
          catchError(error => {
            this.logger.error(`Failed to seed sounds:`, error.message);
            return of({
              operation: operationName,
              status: SeedOperationStatus.FAILED,
              message: `Failed to seed sounds`,
              startTime: new Date(),
              endTime: new Date(),
              error: error.message
            });
          })
        );
      }),
      tap(result => this.updateOperationStatus(result))
    );
  }

  /**
   * Update operation status and general status
   */
  private updateOperationStatus(operationState: SeedOperationState): void {
    const currentStatus = this.statusSubject.getValue();
    
    // Find if this operation already exists in the operations array
    const existingIndex = currentStatus.operations.findIndex(op => op.operation === operationState.operation);
    const operations = [...currentStatus.operations];
    
    if (existingIndex >= 0) {
      operations[existingIndex] = operationState;
    } else {
      operations.push(operationState);
    }
    
    // Calculate metrics
    const errors = operations.filter(op => op.status === SeedOperationStatus.FAILED).length;
    const totalSeeded = operations.reduce((total, op) => total + (op.count || 0), 0);
    
    // Determine overall status
    let overall = currentStatus.overall;
    if (errors > 0) {
      overall = SeedOperationStatus.FAILED;
    } else if (operations.every(op => 
      op.status === SeedOperationStatus.SUCCESS || 
      op.status === SeedOperationStatus.SKIPPED)) {
      overall = SeedOperationStatus.SUCCESS;
    } else {
      overall = SeedOperationStatus.IN_PROGRESS;
    }
    
    // Update the status subject
    this.statusSubject.next({
      ...currentStatus,
      operations,
      overall,
      totalSeeded,
      errors
    });
  }
  
  /**
   * Update the full status object
   */
  private updateStatus(status: SeedStatus): void {
    this.statusSubject.next(status);
  }
}
