import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KablanCard, KablanCardSchema } from './kablan-card.schema';

export type KablanColumnDocument = KablanColumn & Document;

@Schema()
export class KablanColumn {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  order: number;

  @Prop({ type: [KablanCardSchema], default: [] })
  cards: KablanCard[];
}

export const KablanColumnSchema = SchemaFactory.createForClass(KablanColumn);
