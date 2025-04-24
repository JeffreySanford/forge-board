import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KablanCardDocument = KablanCard & Document;

@Schema({ timestamps: true })
export class KablanCard {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @Prop()
  dueDate?: string;

  @Prop()
  assignee?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const KablanCardSchema = SchemaFactory.createForClass(KablanCard);
