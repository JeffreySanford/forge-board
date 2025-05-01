// Card Data Transfer Object
export class CardDto {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Column Data Transfer Object
export class ColumnDto {
  id: string;
  name: string;
  cards: CardDto[];
  order?: number;
  phase?: string;
}

// Project Phase Data Transfer Object
export class PhaseDto {
  active: boolean;
  startDate?: string;
  completionDate?: string;
}

// Board Data Transfer Object
export class KablanBoardDto {
  id: string;
  name: string;
  columns: ColumnDto[];
  currentPhase?: string;
  phases?: Record<string, PhaseDto>;
  createdAt?: string;
  updatedAt?: string;
}

// Create Board Request DTO
export class CreateBoardDto {
  name: string;
}

// Create Column Request DTO
export class CreateColumnDto {
  name: string;
  order?: number;
  phase?: string;
}

// Create Card Request DTO
export class CreateCardDto {
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  assignee?: string;
}

// Move Card Request DTO
export class MoveCardDto {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  sourceIndex?: number;
  targetIndex: number;
}
