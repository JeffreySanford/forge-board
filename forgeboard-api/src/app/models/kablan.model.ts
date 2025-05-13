import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Card schema
@Schema()
export class KablanCard extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;
  
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;
  
  @Prop()
  dueDate?: string;
  
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
export class KablanColumn extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true })
  order: number;
  
  @Prop({ required: true })
  phase: string;
  
  @Prop([Object])
  cards: KablanCard[];
}

// Phase schema
@Schema()
export class KablanPhase extends Document {
  @Prop({ required: true })
  active: boolean;
  
  @Prop()
  startDate?: string;
  
  @Prop()
  completionDate?: string;
}

// Board schema
@Schema()
export class KablanBoard extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop([Object])
  columns: KablanColumn[];
  
  @Prop()
  currentPhase: string;
  
  @Prop({ type: Object })
  phases: Record<string, KablanPhase>;
  
  @Prop({ required: true })
  createdAt: string;
  
  @Prop({ required: true })
  updatedAt: string;
}

export const KablanBoardSchema = SchemaFactory.createForClass(KablanBoard);
