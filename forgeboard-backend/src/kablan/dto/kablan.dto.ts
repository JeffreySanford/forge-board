// Card Data Transfer Object
export class CardDto {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  labels?: string[];
  comments?: CommentDto[];
  createdAt?: string;
  updatedAt?: string;
}

// Comment Data Transfer Object
export class CommentDto {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

// Column Data Transfer Object
export class ColumnDto {
  id: string;
  title: string;
  cards: CardDto[];
  limit?: number;
  order: number;
}

// Board Data Transfer Object
export class KablanBoardDto {
  id: string;
  name: string;
  columns: ColumnDto[];
  createdAt?: string;
  updatedAt?: string;
}

// Create Board Request DTO
export class CreateBoardDto {
  name: string;
}

// Create Column Request DTO
export class CreateColumnDto {
  title: string;
  order?: number;
  limit?: number;
}

// Create Card Request DTO
export class CreateCardDto {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  labels?: string[];
}

// Move Card Request DTO
export class MoveCardDto {
  cardId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  position: number;
}
