# ForgeBoard Drag and Drop Patterns

This document outlines the drag and drop patterns used in ForgeBoard, including best practices and implementation guidelines.

## Overview

ForgeBoard implements drag and drop functionality in several key areas:

1. **Tile Management**: Dashboard tiles can be reordered via drag and drop
2. **Kanban Board**: Cards can be moved between columns
3. **Diagnostics View**: Elements can be arranged in the diagnostics dashboard
4. **Configuration Panels**: Settings can be reordered via drag and drop

## Implementation Patterns

### Component-Level vs. Application-Level

ForgeBoard employs two primary patterns for drag and drop:

#### 1. Application-Level (Centralized)

The app component handles drags that affect application-wide state or require coordination between unrelated components.

```typescript
// In child component
@Output() dragEvent = new EventEmitter<DragEvent>();

onDrag(item: any): void {
  this.dragEvent.emit({
    type: 'item-moved',
    data: { item }
  });
}

// In app component
onChildDragEvent(event: DragEvent): void {
  switch(event.type) {
    case 'item-moved':
      // Handle global state changes
      break;
  }
}
```

**Use when**:
- Drag operations affect multiple components
- Global state consistency is required
- Events need to be tracked at application level

#### 2. Component-Level (Localized)

Components handle their own drag and drop operations with no bubbling to parent components.

```typescript
// In component
onDrop(event: CdkDragDrop<any[]>): void {
  moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  this.stateService.updateItems(this.items).subscribe();
}
```

**Use when**:
- Drag operations are contained within a single component
- Performance is critical (many frequent drag operations)
- Component needs to be self-contained and reusable

### Implementation Guidelines

1. **Prioritize Component-Level Handling**: Keep drag operations contained within components when possible.
2. **Use Services for State Persistence**: Persist state changes via services rather than through component hierarchies.
3. **Optimize for Performance**: Minimize DOM updates during drag operations.
4. **Provide Visual Feedback**: Always include visual feedback during drag operations.
5. **Support Keyboard Navigation**: Ensure drag and drop operations can be performed via keyboard.

## Specific Component Guidelines

### Kanban Board

The Kanban board should implement its own drag and drop logic internally without routing through the app component due to:

1. High frequency of drag operations
2. Complex internal state management
3. Need for performance optimization
4. Self-contained business logic

```typescript
// Recommended approach for Kanban
export class KanbanBoardComponent {
  onCardDrop(event: CdkDragDrop<KanbanCard[]>): void {
    // Handle locally
    moveItemInArray(this.column.cards, event.previousIndex, event.currentIndex);
    
    // Persist directly via service
    this.kanbanService.updateCardPosition(
      this.column.id,
      event.item.data.id,
      event.currentIndex
    ).subscribe();
  }
}
```

### Dashboard Tiles

Dashboard tiles benefit from application-level coordination since:

1. Tiles are part of the global layout
2. Configuration needs to persist across sessions
3. User preferences apply to the entire application

```typescript
// Recommended approach for tiles
export class TileComponent {
  @Output() tileDropped = new EventEmitter<CdkDragDrop<TileType[]>>();
  
  onDrop(event: CdkDragDrop<TileType[]>): void {
    this.tileDropped.emit(event);
  }
}
```

## Performance Considerations

1. **Debounce Persistence**: Debounce service calls during rapid drag operations
2. **Optimistic Updates**: Update UI immediately, then persist to backend
3. **Virtual Scrolling**: Use virtual scrolling for large collections (especially in Kanban board)
4. **Lightweight Previews**: Use lightweight drag previews instead of full components
5. **Throttle Events**: Throttle move events during dragging

## Accessibility

All drag and drop operations must be accessible:

1. Provide keyboard alternatives (using arrow keys + Enter)
2. Include proper ARIA attributes
3. Support screen readers with descriptive announcements
4. Maintain focus properly during drag operations

## Future Improvements

1. Add drag and drop support for cross-component operations
2. Implement drag between different lists in Kanban board
3. Add support for touch gestures and mobile optimization
4. Create reusable drag and drop directives for common patterns
