import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { KanbanSeedService } from '../kanban-seed.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

interface SeedKanbanCommandOptions {
  force: boolean;
  batchSize: number;
}

@Injectable()
@Command({
  name: 'seed:kanban',
  description: 'Seed kanban boards from JSON data',
})
export class SeedKanbanCommand extends CommandRunner {
  private destroy$ = new Subject<void>();

  constructor(private readonly kanbanSeedService: KanbanSeedService) {
    super();

    // Subscribe to seeding status updates
    this.kanbanSeedService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        switch (status.status) {
          case 'idle':
            break;
          case 'seeding':
            console.log(status.message || 'Seeding in progress...');
            break;
          case 'completed':
            console.log(status.message || 'Seeding completed');
            break;
          case 'error':
            console.error('Seeding error:', status.message);
            break;
        }
      });
  }

  @Option({
    flags: '-f, --force [boolean]',
    description:
      'Force seeding even if data exists (will delete existing data)',
  })
  parseForce(val: string): boolean {
    return val === 'true' || val === 'yes' || val === '1';
  }

  @Option({
    flags: '-b, --batch-size [number]',
    description: 'Number of boards to insert in each batch (default: 100)',
  })
  parseBatchSize(val: string): number {
    const size = parseInt(val, 10);
    return isNaN(size) ? 100 : size;
  }

  async run(
    passedParams: string[],
    options?: SeedKanbanCommandOptions
  ): Promise<void> {
    const force = options?.force || false;
    const batchSize = options?.batchSize || 100;

    if (force) {
      console.log('⚠️ Force mode enabled - existing data will be deleted');
    }

    return new Promise<void>((resolve, reject) => {
      this.kanbanSeedService
        .seedKanbanBoards({ force, batchSize })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.destroy$.next();
            this.destroy$.complete();
            resolve();
          })
        )
        .subscribe({
          next: (result) => {
            if (result.seeded) {
              console.log(`✅ ${result.message}`);
            } else {
              console.log(`ℹ️ ${result.message}`);
            }
          },
          error: (error) => {
            console.error('❌ Seeding failed:', error.message);
            reject(error);
          },
        });
    });
  }
}
