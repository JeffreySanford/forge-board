import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { KanbanBoard } from '../models/kanban.model';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import {
  map,
  catchError,
  switchMap,
  tap,
  finalize,
  concatMap,
} from 'rxjs/operators';

export interface KanbanBoardData {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  columns?: KanbanColumnData[];
  [key: string]: unknown; // Allow additional properties
}

export interface KanbanColumnData {
  id?: string;
  name?: string;
  cards?: KanbanCardData[];
  [key: string]: unknown; // Allow additional properties
}

export interface KanbanCardData {
  id?: string;
  title?: string;
  description?: string;
  [key: string]: unknown; // Allow additional properties
}

export interface SeedResult {
  seeded: boolean;
  count: number;
  message?: string;
}

export interface FileLoadResult {
  success: boolean;
  path?: string;
  data?: KanbanBoardData[]; // Replace any[] with KanbanBoardData[]
  error?: string;
}

@Injectable()
export class KanbanSeedService {
  private readonly logger = new Logger('KanbanSeedService');
  private readonly seedingStatus = new BehaviorSubject<{
    status: 'idle' | 'seeding' | 'completed' | 'error';
    message?: string;
    boards?: number;
    cards?: number;
  }>({ status: 'idle' });

  // Board data file paths
  private readonly boardFiles = [
    'kanban-example-boards.json',
    'kanban-forgeboard-stories.json',
    'mock-boards.json',
    'example-boards.json',
  ];

  // Directories to search for board files
  private readonly searchDirs = [
    path.join(__dirname, '../seed/kanban'),
    path.join(__dirname, '../seed'),
    path.join(__dirname, '../mocks/kanban'),
    path.join(__dirname, '../mocks'),
    path.join(process.cwd(), 'forgeboard-api', 'src', 'app', 'seed', 'kanban'),
    path.join(process.cwd(), 'forgeboard-api', 'src', 'app', 'seed'),
    path.join(process.cwd(), 'forgeboard-api', 'src', 'app', 'mocks', 'kanban'),
    path.join(process.cwd(), 'forgeboard-api', 'src', 'app', 'mocks'),
  ];

  constructor(
    @InjectModel(KanbanBoard.name) private kanbanBoardModel: Model<KanbanBoard>
  ) {}

  /**
   * Get the current seeding status as an Observable
   */
  get status$(): Observable<{
    status: 'idle' | 'seeding' | 'completed' | 'error';
    message?: string;
    boards?: number;
    cards?: number;
  }> {
    return this.seedingStatus.asObservable();
  }

  /**
   * Find board files across all search directories
   */
  private findBoardFiles(): Observable<FileLoadResult[]> {
    const filePaths: string[] = [];

    // Generate all possible file paths
    for (const dir of this.searchDirs) {
      for (const file of this.boardFiles) {
        filePaths.push(path.join(dir, file));
      }
    }

    // Map file paths to file load attempts
    return from(filePaths).pipe(
      map((filePath) => this.loadJsonFile(filePath)),
      // Group results by collecting them
      toArray(),
      // Filter out failures
      map((results) => results.filter((result) => result.success))
    );
  }

  /**
   * Load data from a JSON file
   */
  private loadJsonFile(filePath: string): FileLoadResult {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const boards = Array.isArray(data) ? data : [data];

      this.logger.log(`Loaded ${boards.length} boards from ${filePath}`);

      return {
        success: true,
        path: filePath,
        data: boards,
      };
    } catch (error) {
      this.logger.debug(
        `Failed to load JSON from ${filePath}: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Count cards for a single board
   */
  private countBoardCards(board: KanbanBoardData): number {
    return (
      board.columns?.reduce((colTotal, col) => {
        return colTotal + (col.cards?.length || 0);
      }, 0) || 0
    );
  }

  /**
   * Count total cards across all boards
   */
  private countCards(boards: KanbanBoardData[]): number {
    return boards.reduce((total, board) => {
      return total + this.countBoardCards(board);
    }, 0);
  }

  /**
   * Seed the database with kanban boards
   * @param options Optional configuration options for seeding
   */
  public seedKanbanBoards(
    options: {
      force?: boolean; // Force seeding even if data exists
      batchSize?: number; // Number of boards to insert in each batch
    } = {}
  ): Observable<SeedResult> {
    this.seedingStatus.next({
      status: 'seeding',
      message: 'Finding board files...',
    });

    return from(this.kanbanBoardModel.countDocuments().exec()).pipe(
      switchMap((existingCount: number) => {
        if (existingCount > 0 && !options.force) {
          this.seedingStatus.next({
            status: 'completed',
            message: `Skipped seeding - ${existingCount} boards already exist`,
            boards: existingCount,
          });
          return of({
            seeded: false,
            count: existingCount,
            message: `Skipped seeding - ${existingCount} boards already exist`,
          } as SeedResult);
        }

        // If force option is true and records exist, delete them first
        const deleteOp =
          existingCount > 0 && options.force
            ? from(this.kanbanBoardModel.deleteMany({}).exec()).pipe(
                tap(() =>
                  this.logger.log(
                    `Deleted ${existingCount} existing boards due to force option`
                  )
                )
              )
            : of(null);

        return deleteOp.pipe(
          switchMap(() => this.findBoardFiles()),
          tap((fileResults) => {
            this.seedingStatus.next({
              status: 'seeding',
              message: `Found ${fileResults.length} board files`,
            });
          }),
          switchMap((fileResults) => {
            if (fileResults.length === 0) {
              this.logger.warn('No board files found for seeding');
              this.seedingStatus.next({
                status: 'error',
                message: 'No board files found for seeding',
              });
              return of({
                seeded: false,
                count: 0,
                message: 'No board files found for seeding',
              });
            }

            // Combine all boards from all files
            const allBoards = fileResults.reduce((acc, result) => {
              return [...acc, ...(result.data || [])];
            }, []);

            const totalCards = this.countCards(allBoards);

            this.seedingStatus.next({
              status: 'seeding',
              message: `Inserting ${allBoards.length} boards with ${totalCards} cards...`,
              boards: allBoards.length,
              cards: totalCards,
            });

            // Use batch processing if large number of boards
            const batchSize = options.batchSize || 100;
            if (allBoards.length > batchSize) {
              this.logger.log(
                `Using batch processing with size ${batchSize} for ${allBoards.length} boards`
              );

              // Create batches
              const batches: KanbanBoardData[][] = [];
              for (let i = 0; i < allBoards.length; i += batchSize) {
                batches.push(allBoards.slice(i, i + batchSize));
              }

              let processedCount = 0;
              return from(batches).pipe(
                concatMap((batch, index) => {
                  return from(this.kanbanBoardModel.insertMany(batch)).pipe(
                    tap((results) => {
                      processedCount += results.length;
                      const percentComplete = Math.round(
                        (processedCount / allBoards.length) * 100
                      );
                      this.seedingStatus.next({
                        status: 'seeding',
                        message: `Inserted batch ${index + 1}/${
                          batches.length
                        } (${percentComplete}% complete)`,
                        boards: processedCount,
                        cards: this.countCards(batch),
                      });
                    })
                  );
                }),
                toArray(),
                map((batchResults) => {
                  const resultCount = batchResults.reduce(
                    (sum: number, result) => {
                      return sum + (Array.isArray(result) ? result.length : 1);
                    },
                    0
                  );

                  this.seedingStatus.next({
                    status: 'completed',
                    message: `Successfully seeded ${resultCount} boards with ${totalCards} cards`,
                    boards: resultCount,
                    cards: totalCards,
                  });

                  return {
                    seeded: true,
                    count: resultCount,
                    message: `Successfully seeded ${resultCount} boards with ${totalCards} cards`,
                  } as SeedResult;
                }),
                catchError((error) => {
                  this.logger.error(
                    `Failed to seed kanban boards: ${error.message}`
                  );
                  this.seedingStatus.next({
                    status: 'error',
                    message: `Failed to seed kanban boards: ${error.message}`,
                  });

                  return throwError(
                    () =>
                      new Error(
                        `Failed to seed kanban boards: ${error.message}`
                      )
                  );
                })
              );
            }

            // Original code path for smaller collections
            return from(allBoards).pipe(
              tap((board) => {
                const cardCount = this.countBoardCards(board);
                this.logger.log(
                  `Seeding board: ${board.title || board.name || 'Untitled'} (${
                    board._id || 'New'
                  }) with ${cardCount} stories/cards`
                );
              }),
              toArray(),
              switchMap((processedBoards) => {
                return from(
                  this.kanbanBoardModel.insertMany(processedBoards)
                ).pipe(
                  map((results) => {
                    const resultCount = Array.isArray(results)
                      ? results.length
                      : 1;

                    this.seedingStatus.next({
                      status: 'completed',
                      message: `Successfully seeded ${resultCount} boards with ${totalCards} cards`,
                      boards: resultCount,
                      cards: totalCards,
                    });

                    return {
                      seeded: true,
                      count: resultCount,
                      message: `Successfully seeded ${resultCount} boards with ${totalCards} cards`,
                    };
                  }),
                  catchError((error) => {
                    this.logger.error(
                      `Failed to seed kanban boards: ${error.message}`
                    );
                    this.seedingStatus.next({
                      status: 'error',
                      message: `Failed to seed kanban boards: ${error.message}`,
                    });

                    return throwError(
                      () =>
                        new Error(
                          `Failed to seed kanban boards: ${error.message}`
                        )
                    );
                  })
                );
              })
            );
          })
        );
      }),
      catchError((error) => {
        this.logger.error(`Error in seedKanbanBoards: ${error.message}`);
        this.seedingStatus.next({
          status: 'error',
          message: error.message,
        });

        return of({
          seeded: false,
          count: 0,
          message: error.message,
        });
      }),
      finalize(() => {
        if (this.seedingStatus.value.status === 'seeding') {
          this.seedingStatus.next({
            status: 'completed',
            message: 'Seeding process completed',
          });
        }
      })
    );
  }

  /**
   * Load Forgeboard stories from JSON files
   */
  public loadForgeboardStories(): KanbanBoardData[] {
    this.logger.log('Loading Forgeboard stories');
    const storyFiles = ['kanban-forgeboard-stories.json'];
    const boards: KanbanBoardData[] = [];

    for (const dir of this.searchDirs) {
      for (const file of storyFiles) {
        const filePath = path.join(dir, file);
        const result = this.loadJsonFile(filePath);
        if (result.success && result.data) {
          this.logger.log(
            `Loaded ${result.data.length} Forgeboard stories from ${filePath}`
          );
          boards.push(...result.data);
        }
      }
    }

    return boards;
  }

  /**
   * Load example kanban boards from JSON files
   */
  public loadExampleBoards(): KanbanBoardData[] {
    this.logger.log('Loading example kanban boards');
    const exampleFiles = ['example-boards.json', 'kanban-example-boards.json'];
    const boards: KanbanBoardData[] = [];

    for (const dir of this.searchDirs) {
      for (const file of exampleFiles) {
        const filePath = path.join(dir, file);
        const result = this.loadJsonFile(filePath);
        if (result.success && result.data) {
          this.logger.log(
            `Loaded ${result.data.length} example boards from ${filePath}`
          );
          boards.push(...result.data);
        }
      }
    }

    return boards;
  }

  /**
   * Validate board data before insertion
   * Returns valid boards and logs validation errors
   */
  private validateBoardData(boards: KanbanBoardData[]): KanbanBoardData[] {
    return boards.filter((board) => {
      const hasName = !!(board.name || board.title);
      const hasColumns = Array.isArray(board.columns);

      if (!hasName || !hasColumns) {
        this.logger.warn(
          `Invalid board data detected - missing ${
            !hasName ? 'name' : 'columns'
          }`,
          board
        );
        return false;
      }

      return true;
    });
  }
}

// Helper operator to collect emitted values into an array
function toArray<T>() {
  return (source: Observable<T>): Observable<T[]> => {
    return new Observable<T[]>((subscriber) => {
      const values: T[] = [];
      return source.subscribe({
        next: (value) => values.push(value),
        error: (err) => subscriber.error(err),
        complete: () => {
          subscriber.next(values);
          subscriber.complete();
        },
      });
    });
  };
}
