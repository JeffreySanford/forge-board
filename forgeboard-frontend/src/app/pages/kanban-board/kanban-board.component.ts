import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KanbanService, KanbanBoard, KanbanColumn, KanbanCard } from '../../services/kanban.service';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
  standalone: false
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  boards: KanbanBoard[] = [];
  selectedBoard: KanbanBoard | null = null;
  useMockData = true; // Add toggle state for Material Design 3 toggle
  isConnected = false;
  storageType = 'mock';

  constructor(private kanbanService: KanbanService) {}
  ngOnInit() {
    // Subscribe to boards observable
    this.kanbanService.getBoardsObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(boards => {
        this.boards = boards;
        // Always update selected board when new data arrives
        if (boards && boards.length > 0) {
          this.selectedBoard = boards[0];
          console.log('Selected board:', this.selectedBoard);
          console.log('Board columns:', this.selectedBoard.columns);
          
          // Log all cards for debugging
          if (this.selectedBoard.columns) {
            let totalCards = 0;
            this.selectedBoard.columns.forEach((column, index) => {
              const cardCount = column.cards?.length || 0;
              totalCards += cardCount;
              console.log(`Column ${index} (${column.name}): ${cardCount} cards`);
            });
            console.log(`Total cards across all columns: ${totalCards}`);
          }
        }
      });

    // Subscribe to connection status
    this.kanbanService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        console.log('Connection status:', connected);
      });

    // Subscribe to storage type changes
    this.kanbanService.getStorageTypeChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(storageType => {
        this.storageType = storageType;
        console.log('Storage type changed to:', storageType);
        
        // Sync the toggle state with the actual storage type
        this.useMockData = (storageType === 'mock');
      });

    // Load initial boards based on current data source
    this.loadBoards();
  }

  /**
   * getDropListIds - Returns column IDs for CDK drop list connections
   */
  getDropListIds(): string[] {
    if (!this.selectedBoard || !this.selectedBoard.columns) {
      return [];
    }
    return this.selectedBoard.columns.map(column => column.id);
  }

  /** 
   * On Card Drop - Handle CDK drag drop events
   * @param event - The CDK drop event
   */
  onCardDrop(event: CdkDragDrop<KanbanCard[]>): void {
    const sourceColumnId = event.previousContainer.id;
    const targetColumnId = event.container.id;
    const cardId = event.item.data.id;
    
    console.log('[KanbanBoard] Card drop event:', {
      cardId,
      sourceColumnId,
      targetColumnId,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });

    // Handle drag within same column
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      console.log('[KanbanBoard] Moved card within same column');
    } else {
      // Handle drag between different columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      console.log('[KanbanBoard] Transferred card between columns');
    }

    // Update timestamps optimistically
    const movedCard = event.container.data[event.currentIndex];
    if (movedCard) {
      movedCard.updatedAt = new Date().toISOString();
    }

    // Persist the change via service
    this.kanbanService.moveCard(
      cardId,
      sourceColumnId,
      targetColumnId,
      event.currentIndex
    );
  }

  /**
   * Toggle between mock and live data
   */
  onBoardSelection(boardId: string): void {
    console.log(`[KanbanBoard] Selecting board: ${boardId}`);
    const board = this.boards.find(b => b.id === boardId);
    if (board) {
      this.selectedBoard = board;
      console.log(`[KanbanBoard] Selected board: ${board.name} with ${this.getTotalCards(board)} cards`);
    }
  }

  getBoardStats(board: any): string {
    const totalCards = this.getTotalCards(board);
    const columnCount = board.columns?.length || 0;
    return `${totalCards} cards • ${columnCount} columns`;
  }

  private getTotalCards(board: any): number {
    if (!board?.columns) return 0;
    return board.columns.reduce((total: number, column: any) => {
      return total + (column.cards?.length || 0);
    }, 0);
  }

  toggleDataSource(): void {
    console.log('Toggling data source to:', this.useMockData ? 'mock' : 'live');
    this.loadBoards();
  }

  /**
   * Load boards based on current data source setting
   */
  private loadBoards(): void {
    if (this.useMockData) {
      this.kanbanService.loadMockBoards()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (boards) => {
            console.log('Loaded mock boards:', boards);
            this.handleBoardsLoaded(boards);
          },
          error: (error) => {
            console.error('Error loading mock boards:', error);
          }
        });
    } else {
      this.kanbanService.getBoards()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (boards) => {
            console.log('Loaded live boards:', boards);
            this.handleBoardsLoaded(boards);
          },
          error: (error) => {
            console.error('Error loading live boards:', error);
          }
        });
    }
  }  /**
   * Handle boards loaded from either source
   */
  private handleBoardsLoaded(boards: KanbanBoard[]): void {
    this.boards = boards;
    if (boards && boards.length > 0) {
      // Prefer "ForgeBoard Project Stories" as the default working set
      const forgeboardStories = boards.find(board => 
        board.name === 'ForgeBoard Project Stories' || 
        board.id === 'forgeboard-main'
      );
      
      this.selectedBoard = forgeboardStories || boards[0];
      const totalCards = this.getTotalCards(this.selectedBoard);
      console.log(`Selected board: ${this.selectedBoard.name} with ${totalCards} cards`);
      console.log('Available boards:', boards.map(b => `${b.name} (${this.getTotalCards(b)} cards)`));
    }
  }

  /**
   * Returns true if the given index is the last column in selectedBoard.columns
   */
  isLastColumn(index: number): boolean {
    if (!this.selectedBoard || !this.selectedBoard.columns) return false;
    return index === this.selectedBoard.columns.length - 1;
  }

  /**
   * TrackBy function for columns
   */
  trackByColumnId(index: number, column: KanbanColumn): string {
    return column.id || index.toString();
  }

  /**
   * TrackBy function for cards
   */
  trackByCardId(index: number, card: KanbanCard): string {
    return card.id || index.toString();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}