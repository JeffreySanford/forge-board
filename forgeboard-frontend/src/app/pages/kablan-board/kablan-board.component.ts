import { Component, OnDestroy, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
// Remove the unused HostListener import
import { Subscription } from 'rxjs';
import { KablanBoard, KablanColumn, KablanService, ProjectPhase, KablanCard } from '../../services/kablan.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-kablan-board',
  templateUrl: './kablan-board.component.html',
  styleUrls: ['./kablan-board.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('200ms ease-in', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ transform: 'scale(0.8)', opacity: 0 }))
      ])
    ])
  ]
})
export class KablanBoardComponent implements OnInit, OnDestroy {
  board: KablanBoard | null = null;
  isConnected = false;
  storageType = 'Unknown'; // Add this property to track storage type
  forcingMockData = false; // Track whether we're forcing mock data
  availableStorageTypes = ['memory', 'localStorage', 'mongodb', 'blockchain', 'mock'];
  
  // Card navigation properties
  currentCardIndex = 0;
  cardsToShow = 3;
  totalCards = 8;
  visibleColumns: KablanColumn[] = [];
  paginationIndicators: number[] = [];
  
  // Current workflow step
  currentWorkflowStep: 'backlog' | 'todo' | 'complete' = 'backlog';
  
  // Project phase navigation
  currentPhase: ProjectPhase = 'planning';
  allPhases: ProjectPhase[] = ['inception', 'planning', 'design', 'development', 'testing', 'completion'];
  phaseLabels: { [key in ProjectPhase]: string } = {
    inception: 'Inception',
    planning: 'Planning',
    design: 'Design',
    development: 'Development',
    testing: 'Testing',
    completion: 'Completion'
  };
  phaseColumns: Map<ProjectPhase, KablanColumn[]> = new Map();
  
  @ViewChild('columnsContainer') columnsContainer!: ElementRef;
  
  private subscriptions = new Subscription();
  
  constructor(
    private kablanService: KablanService,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.add(
      this.kablanService.getConnectionStatus().subscribe(status => {
        this.isConnected = status;
        console.log('[KablanBoard] Connection status changed:', status);
      })
    );
    
    // Subscribe to board updates
    this.subscriptions.add(
      this.kablanService.getBoards().subscribe(boards => {
        if (boards.length > 0) {
          this.board = boards[0]; // Just take the first board for now
          
          // Set current phase from board
          this.currentPhase = this.board.currentPhase;
          
          // Group columns by phase
          this.groupColumnsByPhase();
          
          // Update visible columns based on phase
          this.updateVisibleColumnsByPhase();
          
          // Update pagination indicators
          this.updatePaginationIndicators();
          
          // Update workflow step
          this.updateWorkflowStep();
        }
      })
    );
    
    // Subscribe to storage type changes
    this.subscriptions.add(
      this.kablanService.getStorageTypeChanges().subscribe(type => {
        this.storageType = type || 'Unknown';
        console.log('[KablanBoard] Storage type changed:', this.storageType);
      })
    );
    
    // Initialize storage type
    this.storageType = this.kablanService.getStorageType() || 'Unknown';
    console.log('[KablanBoard] Initial storage type:', this.storageType);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Toggle between mock data and real backend data
  toggleMockData(): void {
    this.forcingMockData = !this.forcingMockData;
    this.kablanService.toggleMockData(this.forcingMockData);
    console.log('[KablanBoard] Mock data toggled:', this.forcingMockData);
  }
  
  // Change the storage type (for demonstration purposes)
  changeStorageType(type: string): void {
    this.kablanService.setStorageType(type);
    console.log('[KablanBoard] Storage type manually set to:', type);
  }
  
  // Group columns by their phase
  groupColumnsByPhase(): void {
    if (!this.board) return;
    
    this.phaseColumns.clear();
    
    // Initialize empty arrays for each phase
    this.allPhases.forEach(phase => {
      this.phaseColumns.set(phase, []);
    });
    
    // Group columns by phase
    this.board.columns.forEach(column => {
      const phaseColumns = this.phaseColumns.get(column.phase) || [];
      phaseColumns.push(column);
    });
    
    // Sort columns by order within each phase
    this.allPhases.forEach(phase => {
      const columns = this.phaseColumns.get(phase) || [];
      columns.sort((a, b) => a.order - b.order);
    });
  }
  
  // Update visible columns based on current phase
  updateVisibleColumnsByPhase(): void {
    if (!this.board) return;
    
    const phaseColumns = this.phaseColumns.get(this.currentPhase) || [];
    this.totalCards = phaseColumns.length;
    
    // Update visible columns based on current card index and phase
    this.visibleColumns = phaseColumns.slice(
      this.currentCardIndex,
      Math.min(this.currentCardIndex + this.cardsToShow, this.totalCards)
    );
  }
  
  // Switch to a different project phase
  switchPhase(phase: ProjectPhase): void {
    if (this.currentPhase !== phase) {
      this.currentPhase = phase;
      this.currentCardIndex = 0; // Reset card index when switching phases
      this.updateVisibleColumnsByPhase();
      this.updatePaginationIndicators();
    }
  }
  
  // Check if a phase is the current phase
  isCurrentPhase(phase: ProjectPhase): boolean {
    return this.currentPhase === phase;
  }
  
  // Check if a phase is active
  isPhaseActive(phase: ProjectPhase): boolean {
    return this.board?.phases[phase]?.active || false;
  }
  
  // Check if phase is complete
  isPhaseComplete(phase: ProjectPhase): boolean {
    return this.board?.phases[phase]?.completionDate !== undefined;
  }
  
  // Update visible columns based on current index (modified to work with phases)
  updateVisibleColumns(): void {
    this.updateVisibleColumnsByPhase();
  }
  
  // Update pagination indicators
  updatePaginationIndicators(): void {
    const phaseColumns = this.phaseColumns.get(this.currentPhase) || [];
    this.totalCards = phaseColumns.length;
    
    const pageCount = Math.ceil(this.totalCards / this.cardsToShow);
    this.paginationIndicators = Array.from({ length: pageCount }, (_, i) => i);
  }
  
  // Navigation methods (updated)
  navigateCards(direction: 'left' | 'right'): void {
    const phaseColumns = this.phaseColumns.get(this.currentPhase) || [];
    const maxIndex = Math.max(0, phaseColumns.length - this.cardsToShow);
    
    if (direction === 'left' && this.currentCardIndex > 0) {
      this.currentCardIndex -= this.cardsToShow;
    } else if (direction === 'right' && this.currentCardIndex < maxIndex) {
      this.currentCardIndex += this.cardsToShow;
    }
    
    // Make sure we don't have negative index or exceed total cards
    this.currentCardIndex = Math.max(0, Math.min(this.currentCardIndex, maxIndex));
    
    this.updateVisibleColumnsByPhase();
    this.updateWorkflowStep();
    
    // Scroll to the beginning of the container with animation
    if (this.columnsContainer?.nativeElement) {
      this.columnsContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }
  
  goToPage(pageIndex: number): void {
    this.currentCardIndex = pageIndex * this.cardsToShow;
    this.updateVisibleColumns();
    this.updateWorkflowStep();
  }
  
  // Update workflow step based on visible columns
  updateWorkflowStep(): void {
    // Map the current card index to a workflow step
    if (this.currentCardIndex === 0) {
      this.currentWorkflowStep = 'backlog';
    } else if (this.currentCardIndex + this.cardsToShow >= this.totalCards) {
      this.currentWorkflowStep = 'complete';
    } else {
      this.currentWorkflowStep = 'todo';
    }
  }
  
  // Check if a given step is active
  isStepActive(step: 'backlog' | 'todo' | 'complete'): boolean {
    return this.currentWorkflowStep === step;
  }
  
  // Track functions for better performance with *ngFor
  trackByFn(index: number, column: KablanColumn): string {
    return column.id;
  }
  
  trackCardByFn(index: number, card: KablanCard): string {
    return card.id;
  }
  
  // Handle card drop events with improved error handling
  onCardDropped(event: CdkDragDrop<KablanCard[]>): void {
    if (!this.board) return;
    
    try {
      if (event.previousContainer === event.container) {
        // Reordering within the same column
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        // Find source and target column IDs
        const sourceColId = this.findColumnIdByCards(event.previousContainer.data);
        const targetColId = this.findColumnIdByCards(event.container.data);
        
        if (!sourceColId || !targetColId) {
          console.error('Could not find column IDs for drag operation');
          return;
        }
        
        // Get the card being moved
        const cardId = event.previousContainer.data[event.previousIndex].id;
        
        // Update the UI immediately
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        
        // Call service to persist changes - use NgZone to ensure we're in the Angular zone
        this.ngZone.run(() => {
          this.kablanService.moveCard(cardId, sourceColId, targetColId, event.currentIndex);
        });
      }
    } catch (err) {
      console.error('Error during card drop:', err);
    }
  }
  
  // Helper to find column ID by its cards array reference
  private findColumnIdByCards(cards: KablanCard[]): string | null {
    if (!this.board) return null;
    
    const column = this.board.columns.find(col => col.cards === cards);
    return column ? column.id : null;
  }
}
