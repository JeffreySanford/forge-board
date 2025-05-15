import { Route } from '@angular/router';
import { KanbanBoardComponent } from './pages/kanban-board/kanban-board.component';

export const appRoutes: Route[] = [
  { path: 'kanban', component: KanbanBoardComponent }
];
