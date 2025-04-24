import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class KablanCardDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsArray()
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

export class KablanColumnDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  cards: KablanCardDto[];

  order: number;
}

export class KablanBoardDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  columns: KablanColumnDto[];

  createdAt: string;
  updatedAt: string;
}

export class CreateBoardDto {
  @IsString()
  name: string;
}

export class CreateColumnDto {
  @IsString()
  name: string;

  order: number;
}

export class CreateCardDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class MoveCardDto {
  @IsString()
  cardId: string;
  
  @IsString()
  sourceColumnId: string;
  
  @IsString()
  targetColumnId: string;
  
  newIndex: number;
}
