import { Component, OnDestroy, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { KanbanBoard, KanbanColumn, KanbanService, ProjectPhase, KanbanCard } from '../../services/kanban.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate } from '@angular/animations';

// Interface for categorized cards
interface CategoryGroup {
  name: string;
  displayName: string;
  cards: KanbanCard[];
  expanded: boolean;
}

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
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
export class KanbanBoardComponent implements OnInit, OnDestroy {
  // Existing properties
  board: KanbanBoard | null = null;
  isConnected = false;
  storageType = 'Unknown';
  forcingMockData = false;
  availableStorageTypes = ['memory', 'localStorage', 'mongodb', 'blockchain', 'mock'];
  
  // Card navigation properties
  currentCardIndex = 0;
  cardsToShow = 3;
  totalCards = 8;
  visibleColumns: KanbanColumn[] = [];
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
  phaseColumns: Map<ProjectPhase, KanbanColumn[]> = new Map();
  
  // New properties for categorized view
  showCategorizedView = true;
  categoryGroups: CategoryGroup[] = [];
  categoryMappings: { [key: string]: string } = {
    'security': 'Security & Compliance',
    'user-experience': 'User Experience',
    'project-management': 'Project Management',
    'optimization': 'Performance & Optimization',
    'infrastructure': 'Infrastructure',
    'documentation': 'Documentation',
    'feature': 'Feature Development'
  };

  // Map of column ID to category groups for that column
  columnCategoryGroups: Map<string, CategoryGroup[]> = new Map();
  
  @ViewChild('columnsContainer') columnsContainer!: ElementRef;
  
  private subscriptions = new Subscription();
  
  constructor(
    private kanbanService: KanbanService,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    // Existing subscription code
    this.subscriptions.add(
      this.kanbanService.getConnectionStatus().subscribe(status => {
        this.isConnected = status;
        console.log('[KanbanBoard] Connection status changed:', status);
      })
    );
    
    this.subscriptions.add(
      this.kanbanService.getBoards().subscribe(boards => {
        if (boards.length > 0) {
          this.board = boards[0]; // Just take the first board for now
          
          // Set current phase from board
          this.currentPhase = this.board.currentPhase;
          
          // Group columns by phase
          this.groupColumnsByPhase();
          
          // Group cards by category for backlog and all other columns
          this.groupCardsByCategory();
          this.columnCategoryGroups.clear();
          this.board.columns.forEach(column => {
            this.groupCardsByCategoryForColumn(column);
          });
          
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
      this.kanbanService.getStorageTypeChanges().subscribe(type => {
        this.storageType = type || 'Unknown';
        console.log('[KanbanBoard] Storage type changed:', this.storageType);
      })
    );
    
    // Initialize storage type
    this.storageType = this.kanbanService.getStorageType() || 'Unknown';
    console.log('[KanbanBoard] Initial storage type:', this.storageType);
  }
  
  // Group backlog cards by category
  groupCardsByCategory(): void {
    if (!this.board) return;
    
    // Find the backlog column
    const backlogColumn = this.board.columns.find(col => col.name === 'Backlog');
    if (!backlogColumn) return;
    
    // Clear existing category groups
    this.categoryGroups = [];
    
    // Create a map to hold cards by category
    const cardsByCategory: { [category: string]: KanbanCard[] } = {};
    
    // Group cards by their category
    backlogColumn.cards.forEach(card => {
      const category = card.category || 'uncategorized';
      if (!cardsByCategory[category]) {
        cardsByCategory[category] = [];
      }
      cardsByCategory[category].push(card);
    });
    
    // Convert map to array of category groups
    Object.keys(cardsByCategory).forEach(category => {
      this.categoryGroups.push({
        name: category,
        displayName: this.categoryMappings[category] || this.capitalizeFirstLetter(category),
        cards: cardsByCategory[category],
        expanded: true
      });
    });
    
    // Sort categories alphabetically by display name
    this.categoryGroups.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  
  // Group cards by category for a specific column
  groupCardsByCategoryForColumn(column: KanbanColumn): CategoryGroup[] {
    if (!column) return [];
    
    // Create a map to hold cards by category
    const cardsByCategory: { [category: string]: KanbanCard[] } = {};
    
    // Group cards by their category
    column.cards.forEach(card => {
      const category = card.category || 'uncategorized';
      if (!cardsByCategory[category]) {
        cardsByCategory[category] = [];
      }
      cardsByCategory[category].push(card);
    });
    
    // Convert map to array of category groups
    const categoryGroups: CategoryGroup[] = [];
    Object.keys(cardsByCategory).forEach(category => {
      categoryGroups.push({
        name: category,
        displayName: this.categoryMappings[category] || this.capitalizeFirstLetter(category),
        cards: cardsByCategory[category],
        expanded: true
      });
    });
    
    // Sort categories alphabetically by display name
    categoryGroups.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    // Store in the map for future reference
    this.columnCategoryGroups.set(column.id, categoryGroups);
    
    return categoryGroups;
  }
  
  // Helper function to capitalize first letter of each word
  capitalizeFirstLetter(string: string): string {
    return string.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  // Toggle categorized view
  toggleCategorizedView(): void {
    this.showCategorizedView = !this.showCategorizedView;
    console.log('[KanbanBoard] Categorized view:', this.showCategorizedView);
  }
  
  // Toggle category expansion
  toggleCategory(category: CategoryGroup): void {
    category.expanded = !category.expanded;
  }
  
  // Get category groups for a column
  getColumnCategoryGroups(column: KanbanColumn): CategoryGroup[] {
    if (!column) return [];
    
    // Return cached category groups if available
    if (this.columnCategoryGroups.has(column.id)) {
      const groups = this.columnCategoryGroups.get(column.id);
      return groups || []; // Return empty array if groups is undefined
    }
    
    // Otherwise, create them
    return this.groupCardsByCategoryForColumn(column);
  }
  
  // Toggle a category's expansion state
  toggleColumnCategory(column: KanbanColumn, categoryGroup: CategoryGroup): void {
    if (!column || !categoryGroup) return;
    categoryGroup.expanded = !categoryGroup.expanded;
  }
  
  // Existing methods remain the same
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  toggleMockData(): void {
    this.forcingMockData = !this.forcingMockData;
    this.kanbanService.toggleMockData(this.forcingMockData);
    console.log('[KanbanBoard] Mock data toggled:', this.forcingMockData);
  }
  
  // Change the storage type (for demonstration purposes)
  changeStorageType(type: string): void {
    this.kanbanService.setStorageType(type);
    console.log('[KanbanBoard] Storage type manually set to:', type);
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
      // Cast column.phase to ProjectPhase to avoid type error
      const phase = column.phase as ProjectPhase;
      const phaseColumns = this.phaseColumns.get(phase) || [];
      phaseColumns.push(column);
      this.phaseColumns.set(phase, phaseColumns);
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
  trackByFn(index: number, column: KanbanColumn): string {
    return column.id;
  }
  
  trackCardByFn(index: number, card: KanbanCard): string {
    return card.id;
  }
  
  // Handle card drop events with improved error handling
  onCardDropped(event: CdkDragDrop<KanbanCard[]>): void {
    if (!this.board) return;
    
    try {
      if (event.previousContainer === event.container) {
        // Reordering within the same column/category
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
          this.kanbanService.moveCard(cardId, sourceColId, targetColId, event.currentIndex);
        });
        
        // Update category groups for affected columns
        if (sourceColId) {
          const sourceCol = this.board.columns.find(col => col.id === sourceColId);
          if (sourceCol) {
            this.groupCardsByCategoryForColumn(sourceCol);
          }
        }
        
        if (targetColId && targetColId !== sourceColId) {
          const targetCol = this.board.columns.find(col => col.id === targetColId);
          if (targetCol) {
            this.groupCardsByCategoryForColumn(targetCol);
          }
        }
        
        // Re-group cards if cards were moved to/from backlog
        if (sourceColId === 'col3' || targetColId === 'col3') {
          this.groupCardsByCategory();
        }
      }
    } catch (err) {
      console.error('Error during card drop:', err);
    }
  }
  
  // Helper to find column ID by its cards array reference
  private findColumnIdByCards(cards: KanbanCard[]): string | null {
    if (!this.board) return null;
    
    const column = this.board.columns.find(col => col.cards === cards);
    return column ? column.id : null;
  }
}