import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KablanCardDocument = KablanCard & Document;

@Schema()
export class KablanCard {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'medium' })
  priority: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  assignee: string;
}

export const KablanCardSchema = SchemaFactory.createForClass(KablanCard);
