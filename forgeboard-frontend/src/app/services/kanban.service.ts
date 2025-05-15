import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { BackendStatusService } from './backend-status.service';
import { SocketClientService } from '../core/services/socket/socket-client.service';

// Define a proper injection token for Socket
import { InjectionToken } from '@angular/core';
export const SOCKET_TOKEN = new InjectionToken<Socket>('SOCKET_TOKEN');

// Type definitions
export type ProjectPhase = 'inception' | 'planning' | 'design' | 'development' | 'testing' | 'completion';
export type Priority = 'low' | 'medium' | 'high';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
  assignee?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  phase: string;
  cards: KanbanCard[];
}

export interface KanbanPhase {
  active: boolean;
  startDate?: string;
  completionDate?: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  currentPhase: ProjectPhase;
  phases: Record<ProjectPhase, KanbanPhase>;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService implements OnDestroy {
  private boardsSubject = new BehaviorSubject<KanbanBoard[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private storageTypeSubject = new BehaviorSubject<string | null>(null);
  private forceMockData = false;
  private currentStorageType: string | null = null;
  private socket: Socket;
  constructor(
    private socketClient: SocketClientService,
    private backendStatusService: BackendStatusService
  ) {
    // Initialize socket connection with proper namespace format
    this.socket = this.socketClient.connect('/kanban');
    
    // Initialize connection
    this.initializeConnection();
    
    // Listen for backend status changes
    this.backendStatusService.getStatus().subscribe(isOnline => {
      if (isOnline) {
        this.connectToBackend();
      } else {
        this.disconnectFromBackend();
        this.useMockData();
      }
    });
  }

  // Initialize connection to backend
  private initializeConnection(): void {
    this.socket.on('connect', () => {
      console.log('Socket connected to Kanban namespace');
      this.connectionStatusSubject.next(true);
      this.fetchBoards();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected from Kanban namespace');
      this.connectionStatusSubject.next(false);
      
      // Use mock data if disconnected
      if (!this.forceMockData) {
        this.useMockData();
      }
    });

    this.socket.on('boards-update', (response: {status: string, data: {boards: KanbanBoard[], storageType: string}}) => {
      if (response && response.data) {
        this.boardsSubject.next(response.data.boards);
        
        if (response.data.storageType) {
          this.currentStorageType = response.data.storageType;
          this.storageTypeSubject.next(response.data.storageType);
        }
      }
    });
  }

  // Connect to backend
  private connectToBackend(): void {
    if (!this.forceMockData && this.socket) {
      // Using the socketClient's connection
      this.fetchBoards();
    }
  }

  // Disconnect from backend
  private disconnectFromBackend(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connectionStatusSubject.next(false);
  }

  // Use mock data
  private useMockData(): void {
    console.log('Using mock Kanban data');
    const mockData: KanbanBoard[] = [
      {
        id: "board1",
        name: "ForgeBoard Development",
        columns: [
          {
            id: "col1",
            name: "To Do",
            order: 1,
            phase: "planning",
            cards: [
              {
                id: "card1",
                title: "Implement Authentication",
                description: "Set up JWT authentication for the API",
                priority: "high",
                tags: ["security", "api"],
                category: "security",
                createdAt: "2023-05-10T12:00:00Z",
                updatedAt: "2023-05-10T12:00:00Z"
              },
              {
                id: "card2",
                title: "Create Dashboard Layout",
                description: "Design and implement the main dashboard layout",
                priority: "medium",
                tags: ["ui", "frontend"],
                category: "user-experience",
                createdAt: "2023-05-10T12:00:00Z",
                updatedAt: "2023-05-10T12:00:00Z"
              }
            ]
          }
        ],
        currentPhase: "planning",
        phases: {
          inception: {
            active: true,
            startDate: "2023-04-10T00:00:00Z",
            completionDate: "2023-04-25T00:00:00Z"
          },
          planning: {
            active: true,
            startDate: "2023-04-26T00:00:00Z"
          },
          design: {
            active: false
          },
          development: {
            active: false
          },
          testing: {
            active: false
          },
          completion: {
            active: false
          }
        },
        createdAt: "2023-04-10T00:00:00Z",
        updatedAt: "2023-05-10T12:00:00Z"
      }
    ];
    
    this.boardsSubject.next(mockData);
    this.connectionStatusSubject.next(false);
    this.currentStorageType = 'mock';
    this.storageTypeSubject.next('mock');
  }

  // Fetch boards from backend
  fetchBoards(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get-boards');
    }
  }

  // Get boards as observable
  getBoards(): Observable<KanbanBoard[]> {
    return this.boardsSubject.asObservable();
  }

  // Get connection status as observable
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  // Get storage type changes as observable
  getStorageTypeChanges(): Observable<string | null> {
    return this.storageTypeSubject.asObservable();
  }

  // Get current storage type
  getStorageType(): string | null {
    return this.currentStorageType;
  }

  // Set storage type
  setStorageType(type: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('set-storage-type', { type });
    }
  }

  // Toggle mock data
  toggleMockData(forceMock: boolean): void {
    this.forceMockData = forceMock;

    if (forceMock) {
      this.disconnectFromBackend();
      this.useMockData();
    } else {
      this.connectToBackend();
    }
  }

  // Move card between columns
  moveCard(cardId: string, sourceColumnId: string, targetColumnId: string, newIndex: number): void {
    if (!this.connectionStatusSubject.value) {
      console.log('Not connected to backend. Card move will not be persisted.');
      return;
    }

    // Find the board ID (assuming we only have one board for now)
    const boards = this.boardsSubject.value;
    if (boards.length === 0) {
      console.error('No boards available');
      return;
    }

    const boardId = boards[0].id;

    // Emit card move event to server
    if (this.socket && this.socket.connected) {
      this.socket.emit('move-card', {
        boardId,
        moveCard: {
          cardId,
          sourceColumnId,
          targetColumnId,
          newIndex,
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from subscriptions
    this.connectionStatusSubject.complete();
    this.boardsSubject.complete();
    this.storageTypeSubject.complete();
    
    // Clean up socket connections
    if (this.socket) {
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('boards-update');
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }
}