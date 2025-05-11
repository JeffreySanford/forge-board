import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, of } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { BackendStatusService } from './backend-status.service';
import { SocketResponse } from '@forge-board/shared/api-interfaces';
import { LoggerService } from './logger.service';
// Import mock data
import mockBoardsData from '../mocks/kablan/mock-boards.json';

// Define project phases
export type ProjectPhase = 'inception' | 'planning' | 'design' | 'development' | 'testing' | 'completion';

export interface KablanBoard {
  id: string;
  name: string;
  columns: KablanColumn[];
  currentPhase: ProjectPhase;
  phases: {
    [key in ProjectPhase]: {
      active: boolean;
      startDate?: string;
      completionDate?: string;
    }
  };
  createdAt: string;
  updatedAt: string;
}

export interface KablanColumn {
  id: string;
  name: string;
  order: number;
  phase: ProjectPhase;
  cards: KablanCard[];
}

export interface KablanCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignee?: string;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class KablanService implements OnDestroy {  // API URLs
  // Cast environment to specific type to access properties
  private readonly typedEnv = environment as unknown as {
    apiBaseUrl: string;
    socketBaseUrl: string;
    apiUrl: string;
    socketUrl: string;
  };
  private readonly apiUrl = `${this.typedEnv.apiBaseUrl || this.typedEnv.apiUrl}/kablan`;
  private readonly socketUrl = this.typedEnv.socketBaseUrl || this.typedEnv.socketUrl;
  
  // Socket connection
  private socket: Socket | null = null;
  
  // Status tracking
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private boardsSubject = new BehaviorSubject<KablanBoard[]>([]);
  private mockDataInterval: ReturnType<typeof setTimeout> | null = null; // Fix NodeJS.Timeout issue
  private reconnecting = false;
  private backendAvailableListener: () => void;
  private subscriptions = new Subscription();
  private storageType = 'unknown';
  private forceMockData = false;
  private storageTypeSubject = new BehaviorSubject<string>(this.storageType);

  constructor(
    private http: HttpClient,
    private backendStatusService: BackendStatusService,
    private logger: LoggerService
  ) {
    this.logger.info('[KablanService] Initializing service', 'KablanService');
    // The registerGateway method is now properly defined in BackendStatusService
    this.backendStatusService.registerGateway('kablan');
    
    // Try to establish a socket connection, fall back to mock data if needed
    this.initSocket();
    
    // Listen for backend availability to reconnect
    this.backendAvailableListener = () => {
      if (this.mockDataInterval && !this.reconnecting) {
        this.reconnectToBackend();
      }
    };
    window.addEventListener('backend-available', this.backendAvailableListener);
  }

  ngOnDestroy(): void {
    this.logger.info('[KablanService] Destroying service, cleaning up resources', 'KablanService');
    this.subscriptions.unsubscribe();
    
    // Remove event listener
    window.removeEventListener('backend-available', this.backendAvailableListener);
    
    // Clean up socket
    this.cleanupSocket();
    
    // Clear mock data if running
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
    
    // Complete subjects
    this.connectionStatusSubject.complete();
    this.boardsSubject.complete();
  }
  
  // Observable getters
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
  
  getBoards(): Observable<KablanBoard[]> {
    return this.boardsSubject.asObservable();
  }
  
  // Add method to get storage type
  getStorageType(): string {
    this.logger.debug('[KablanService] Getting storage type: ' + this.storageType, 'KablanService');
    return this.storageType;
  }
  
  // Get storage type as an observable
  getStorageTypeChanges(): Observable<string> {
    return this.storageTypeSubject.asObservable();
  }
  
  // Toggle between mock data and real data
  toggleMockData(useMockData: boolean): void {
    this.forceMockData = useMockData;
    
    if (useMockData) {
      // Disconnect socket and use mock data
      this.logger.info('[KablanService] Switching to mock data', 'KablanService');
      this.disconnectSocket();
      this.startMockDataGeneration();
      this.connectionStatusSubject.next(false);
    } else {
      // Try to reconnect to real data
      this.logger.info('[KablanService] Attempting to connect to real data', 'KablanService');
      this.stopMockDataGeneration();
      this.initSocket();
    }
  }
  
  // Force a storage type (for demonstration purposes)
  setStorageType(type: string): void {
    this.storageType = type;
    this.storageTypeSubject.next(type);
    this.logger.info('[KablanService] Storage type set to: ' + type, 'KablanService');
  }
  
  // Socket initialization
  private initSocket(): void {
    try {
      // Try to connect to the kablan namespace first
      this.logger.info('[KablanService] Initializing socket connection to ' + `${this.socketUrl}/kablan`, 'KablanService');
      
      // Clean up existing socket if any
      this.cleanupSocket();
      
      // First try the /kablan namespace
      this.socket = io(`${this.socketUrl}/kablan`, {
        withCredentials: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 1, // Only try once before falling back
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      // Add error handler for invalid namespace
      this.socket.on('connect_error', (err) => {
        if (err.message.includes('Invalid namespace')) {
          this.logger.info('[KablanService] Kablan namespace not found, trying root namespace', 'KablanService');
          this.cleanupSocket();
          
          // Try the root namespace as fallback
          this.socket = io(this.socketUrl, {
            withCredentials: false,
            transports: ['websocket', 'polling'],
            timeout: 5000,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            forceNew: true
          });
          
          this.setupSocketEvents();
        } else {
          this.logger.error('[KablanService] Socket connection error:', 'KablanService', { error: err });
          this.connectionStatusSubject.next(false);
          this.backendStatusService.updateGatewayStatus('kablan', false, false);
          this.startMockDataGeneration();
        }
      });
      
      // Setup socket events
      this.setupSocketEvents();
    } catch (err) {
      this.logger.error('[KablanService] Socket initialization error:', 'KablanService', { error: err });
      this.backendStatusService.updateGatewayStatus('kablan', false, false);
      this.startMockDataGeneration();
    }
  }
  
  private setupSocketEvents(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      this.logger.info('[KablanService] Socket connected', 'KablanService');
      this.connectionStatusSubject.next(true);
      this.backendStatusService.updateGatewayStatus('kablan', true, false);
      this.stopMockDataGeneration();
      
      // Request initial data
      this.socket?.emit('get-boards');
    });
    
    this.socket.on('disconnect', () => {
      this.logger.info('[KablanService] Socket disconnected', 'KablanService');
      this.connectionStatusSubject.next(false);
      this.backendStatusService.updateGatewayStatus('kablan', false, false);
      this.startMockDataGeneration();
    });
    
    // Listen for board updates
    this.socket.on('boards-update', (response: SocketResponse<{boards: KablanBoard[], storageType: string}>) => {
      this.logger.info('[KablanService] Received boards update:', 'KablanService', { response });
      if (response.status === 'success') {
        this.storageType = response.data.storageType || 'unknown';
        this.logger.info('[KablanService] Updated storage type to: ' + this.storageType, 'KablanService');
        this.boardsSubject.next(response.data.boards);
      }
    });
  }
  
  private cleanupSocket(): void {
    if (this.socket) {
      // Remove all event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('boards-update');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
  }
  
  private disconnectSocket(): void {
    if (this.socket) {
      this.logger.info('[KablanService] Disconnecting socket', 'KablanService');
      
      // Remove all event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('boards-update');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
      this.connectionStatusSubject.next(false);
    }
  }
  
  private reconnectToBackend(): void {
    // Implement reconnection logic here
    if (this.reconnecting) return;
    this.reconnecting = true;
    
    this.logger.info('[KablanService] Attempting to reconnect to backend', 'KablanService');
      // Explicitly use the global status endpoint, NOT kablan-specific
    // This ensures we're connecting to /api/status which exists in the backend
    const statusEndpoint = `${this.typedEnv.apiBaseUrl || this.typedEnv.apiUrl}/status`;
    this.logger.info('[KablanService] Checking backend availability at: ' + statusEndpoint, 'KablanService');
    
    this.http.get(statusEndpoint).pipe(
      catchError((err) => {
        this.logger.error('[KablanService] Error checking backend status:', 'KablanService', { error: err });
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.cleanupSocket();
        this.initSocket();
      }
      
      // Reset reconnecting flag after delay
      setTimeout(() => {
        this.reconnecting = false;
      }, 5000);
    });
  }
  
  private startMockDataGeneration(): void {
    if (this.mockDataInterval) return;
    
    this.logger.info('[KablanService] Starting mock data generation', 'KablanService');
    
    // Use the imported mock data instead of inline definition
    // Create deep copy to prevent mutation of original data
    const mockBoards: KablanBoard[] = JSON.parse(JSON.stringify(mockBoardsData));
    
    // Update timestamps to be relative to current time
    mockBoards.forEach(board => {
      // Set board timestamps
      board.createdAt = new Date().toISOString();
      board.updatedAt = new Date().toISOString();
      
      // Update phase dates to be relative to now
      if (board.phases.inception.startDate) {
        board.phases.inception.startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (board.phases.inception.completionDate) {
        board.phases.inception.completionDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (board.phases.planning.startDate) {
        board.phases.planning.startDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      }
    });
    
    this.boardsSubject.next(mockBoards);
    
    this.mockDataInterval = setInterval(() => {
      // Simulate occasional updates to mock data
      const boards = [...this.boardsSubject.value];
      // Add a timestamp to a random card to simulate activity
      if (boards.length > 0 && boards[0].columns.length > 0) {
        const randomColumnIndex = Math.floor(Math.random() * boards[0].columns.length);
        const column = boards[0].columns[randomColumnIndex];
        
        if (column.cards.length > 0) {
          const randomCardIndex = Math.floor(Math.random() * column.cards.length);
          column.cards[randomCardIndex].updatedAt = new Date().toISOString();
        }
      }
      
      this.boardsSubject.next(boards);
    }, 30000); // Update every 30 seconds
    
    // Update backend status
    this.backendStatusService.updateGatewayStatus('kablan', false, true);
  }
  
  private stopMockDataGeneration(): void {
    if (!this.mockDataInterval) return;
    
    this.logger.info('[KablanService] Stopping mock data generation', 'KablanService');
    
    clearInterval(this.mockDataInterval);
    this.mockDataInterval = null;
  }
  
  // Helper method to create mock cards
  private createMockCard(
    id: string, 
    title: string, 
    description: string, 
    priority: 'low' | 'medium' | 'high', 
    tags: string[],
    assignee?: string
  ): KablanCard {
    const now = new Date().toISOString();
    return {
      id,
      title,
      description,
      priority,
      tags,
      assignee,
      createdAt: now,
      updatedAt: now
    };
  }
  
  // Public method to move a card (will be used when dragging)
  public moveCard(cardId: string, sourceColId: string, targetColId: string, newIndex: number): void {
    try {
      if (this.socket && this.connectionStatusSubject.value) {
        // If connected to websocket, send the move event
        this.socket.emit('move-card', {
          boardId: this.boardsSubject.value[0]?.id,
          moveCard: {
            cardId,
            sourceColumnId: sourceColId,
            targetColumnId: targetColId,
            newIndex
          }
        });
      } else {
        // Otherwise, update mock data directly
        const boards = [...this.boardsSubject.value];
        if (boards.length === 0) return;
        
        const board = boards[0];
        const sourceColIndex = board.columns.findIndex(col => col.id === sourceColId);
        const targetColIndex = board.columns.findIndex(col => col.id === targetColId);
        
        if (sourceColIndex === -1 || targetColIndex === -1) return;
        
        const sourceCol = board.columns[sourceColIndex];
        const targetCol = board.columns[targetColIndex];
        
        const cardIndex = sourceCol.cards.findIndex(card => card.id === cardId);
        if (cardIndex === -1) return;
        
        // Remove the card from the source column
        const [card] = sourceCol.cards.splice(cardIndex, 1);
        
        // Update the timestamp
        card.updatedAt = new Date().toISOString();
        
        // Add the card to the target column at the specified index
        targetCol.cards.splice(newIndex, 0, card);
        
        // Update the board
        this.boardsSubject.next(boards);
        this.logger.info('[KablanService] Card moved locally:', 'KablanService', { cardId, from: sourceColId, to: targetColId, index: newIndex });
      }
    } catch (err) {
      this.logger.error('[KablanService] Error moving card:', 'KablanService', { error: err });
    }
  }
}
