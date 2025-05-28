import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, from, Subject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

// Types and interfaces
export type ProjectPhase = 'inception' | 'planning' | 'design' | 'development' | 'testing' | 'completion';
export type CardPriority = 'low' | 'medium' | 'high';

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: CardPriority;
  tags: string[];
  category?: string;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  phase: ProjectPhase;
  cards: KanbanCard[];
}

export interface PhaseInfo {
  active: boolean;
  startDate?: string;
  completionDate?: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  currentPhase: ProjectPhase;
  phases: Record<ProjectPhase, PhaseInfo>;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService implements OnDestroy {
  private socket: Socket | null = null;
  private boardsSubject = new BehaviorSubject<KanbanBoard[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private storageTypeSubject = new BehaviorSubject<string>('mock');
  private destroy$ = new Subject<void>();
  private forcingMockData = false;
  
  // Configuration
  private currentStorageType = 'mock'; // Default to mock data
  private apiUrl = environment.apiBaseUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) {
    this.loadFallbackDataFirst().subscribe(() => {
      this.connectToWebSocket();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private loadFallbackDataFirst(): Observable<void> {
    return from(import('../../assets/kanban/kanban-boards.json')).pipe(
      map((mockData: any) => {
        console.log('[KanbanService] Loaded initial fallback mock data');
        const data = mockData.default || mockData;
        const boardsArray = Array.isArray(data) ? data : [data];
        
        // Type-safe conversion ensuring phases are ProjectPhase types
        const typedBoards = boardsArray.map((board: any) => ({
          ...board,
          columns: board.columns?.map((col: any) => ({
            ...col,
            phase: col.phase as ProjectPhase // Type assertion for phase
          })) || []
        })) as KanbanBoard[];
        
        this.boardsSubject.next(typedBoards);
        this.storageTypeSubject.next('mock');
        this.currentStorageType = 'mock';
        return void 0;
      }),
      catchError(error => {
        console.error('[KanbanService] Failed to load initial fallback data:', error);
        return of(void 0);
      })
    );
  }

  private connectToWebSocket(): void {
    try {
      // Use environment configuration for socket URL
      const socketUrl = environment.socketBaseUrl || environment.apiBaseUrl || 'http://localhost:3000';
      this.socket = io(`${socketUrl}/kanban`, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3
      });

      this.socket.on('connect', () => {
        console.log('[KanbanService] Connected to WebSocket');
        this.connectionStatusSubject.next(true);
        this.currentStorageType = 'memory';
        this.storageTypeSubject.next('memory');
        this.requestBoards();
      });

      this.socket.on('disconnect', () => {
        console.log('[KanbanService] Disconnected from WebSocket');
        this.connectionStatusSubject.next(false);
        this.currentStorageType = 'mock';
        this.storageTypeSubject.next('mock');
      });      this.socket.on('boards-update', (response: { data?: { boards?: KanbanBoard[]; storageType?: string } }) => {
        console.log('[KanbanService] Received boards update:', response);
        if (response.data) {
          if (response.data.boards) {
            console.log(`[KanbanService] Processing ${response.data.boards.length} boards from server:`);
            response.data.boards.forEach((board, index) => {
              const totalCards = board.columns?.reduce((sum, col) => sum + (col.cards?.length || 0), 0) || 0;
              console.log(`  Board ${index}: "${board.name}" - ${board.columns?.length || 0} columns, ${totalCards} total cards`);
              board.columns?.forEach((col, colIndex) => {
                console.log(`    Column ${colIndex}: "${col.name}" - ${col.cards?.length || 0} cards`);
              });
            });
            this.boardsSubject.next(response.data.boards);
          }
          if (response.data.storageType) {
            this.currentStorageType = response.data.storageType;
            this.storageTypeSubject.next(response.data.storageType);
          }
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('[KanbanService] Connection error:', error);
        this.connectionStatusSubject.next(false);
        this.currentStorageType = 'mock';
        this.storageTypeSubject.next('mock');
      });

      this.socket.on('reconnect_failed', () => {
        console.warn('[KanbanService] Failed to reconnect after maximum attempts');
        this.connectionStatusSubject.next(false);
        this.currentStorageType = 'mock';
        this.storageTypeSubject.next('mock');
      });

    } catch (error) {
      console.error('[KanbanService] Failed to initialize WebSocket:', error);
      this.connectionStatusSubject.next(false);
      this.currentStorageType = 'mock';
      this.storageTypeSubject.next('mock');
    }
  }

  private requestBoards(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-boards', {});
    }
  }

  /**
   * Load mock boards from JSON file - returns Observable directly
   */
  loadMockBoards(): Observable<KanbanBoard[]> {
    return from(import('../../assets/kanban/kanban-boards.json')).pipe(
      map((mockData: any) => {
        const boardsData = mockData.default || mockData;
        
        // Ensure we have an array and properly format the data
        const boards = Array.isArray(boardsData) ? boardsData : [boardsData];
        
        // Type-safe conversion ensuring phases are ProjectPhase types
        const typedBoards = boards.map((board: any) => ({
          ...board,
          columns: board.columns?.map((col: any) => ({
            ...col,
            phase: col.phase as ProjectPhase // Type assertion for phase
          })) || []
        })) as KanbanBoard[];
        
        // Log for debugging
        console.log('Raw mock data:', typedBoards);
        typedBoards.forEach((board: KanbanBoard, index: number) => {
          console.log(`Board ${index}:`, board.name, 'Columns:', board.columns?.length);
          board.columns?.forEach((col: KanbanColumn, colIndex: number) => {
            console.log(`  Column ${colIndex}:`, col.name, 'Cards:', col.cards?.length);
          });
        });
        
        this.boardsSubject.next(typedBoards);
        return typedBoards;
      }),
      catchError(error => {
        console.error('Error loading mock boards:', error);
        this.boardsSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Get boards from API using HttpClient
   */
  getBoards(): Observable<KanbanBoard[]> {
    return this.http.get<KanbanBoard[]>(`${this.apiUrl}/kanban/boards`).pipe(
      tap(boards => {
        console.log('Loaded boards from API:', boards);
        this.boardsSubject.next(boards);
      }),
      catchError(error => {
        console.error('Error loading boards from API:', error);
        // Fallback to mock data
        return this.loadMockBoards();
      })
    );
  }

  // Public methods
  getBoardsObservable(): Observable<KanbanBoard[]> {
    return this.boardsSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  getStorageTypeChanges(): Observable<string> {
    return this.storageTypeSubject.asObservable();
  }

  getStorageType(): string {
    return this.currentStorageType;
  }

  setStorageType(type: string): void {
    this.currentStorageType = type;
    this.storageTypeSubject.next(type);
    console.log('[KanbanService] Storage type set to:', type);
    
    // If connected to websocket, send storage type change
    if (this.socket?.connected) {
      this.socket.emit('set-storage-type', { storageType: type });
    }
  }

  toggleMockData(force: boolean): Observable<void> {
    this.forcingMockData = force;
    console.log('[KanbanService] Mock data toggled:', force);
    
    if (force || !this.socket?.connected) {
      return this.loadFallbackDataFirst();
    } else if (this.socket?.connected) {
      this.socket.emit('toggle-mock-data', { force });
      return of(void 0);
    }
    return of(void 0);
  }

  moveCard(cardId: string, sourceColumnId: string, targetColumnId: string, newIndex: number): void {
    if (this.socket?.connected) {
      const payload = {
        boardId: this.boardsSubject.value[0]?.id || '1',
        moveCard: {
          cardId,
          sourceColumnId,
          targetColumnId,
          newIndex
        }
      };
      
      console.log('[KanbanService] Moving card:', payload);
      this.socket.emit('move-card', payload);
    } else {
      console.warn('[KanbanService] Cannot move card - WebSocket not connected');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}