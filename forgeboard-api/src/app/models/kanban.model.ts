import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Card schema
@Schema()
export class KanbanCard extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;
  
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;
  
  @Prop()
  dueDate?: Date;
  
  @Prop()
  assignee?: string;
  
  @Prop([String])
  tags: string[];
  
  @Prop()
  category?: string;
  
  @Prop({ required: true })
  createdAt: string;
  
  @Prop({ required: true })
  updatedAt: string;
}

// Column schema
@Schema()
export class KanbanColumn extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true })
  order: number;
  
  @Prop({ required: true })
  phase: string;
  
  @Prop([Object])
  cards: KanbanCard[];
}

// Phase schema
@Schema()
export class KanbanPhase extends Document {
  @Prop({ required: true })
  active: boolean;
  
  @Prop()
  startDate?: string;
  
  @Prop()
  completionDate?: string;
}

// Board schema
@Schema()
export class KanbanBoard extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop([Object])
  columns: KanbanColumn[];
  
  @Prop()
  currentPhase: string;
  
  @Prop({ type: Object })
  phases: Record<string, KanbanPhase>;
  
  @Prop({ required: true })
  createdAt: string;
  
  @Prop({ required: true })
  updatedAt: string;
}

export const KanbanBoardSchema = SchemaFactory.createForClass(KanbanBoard);
