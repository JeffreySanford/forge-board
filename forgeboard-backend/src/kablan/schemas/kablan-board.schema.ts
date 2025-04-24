import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { KablanColumn, KablanColumnSchema } from './kablan-column.schema';

export type KablanBoardDocument = KablanBoard & Document;

@Schema({ timestamps: true })
export class KablanBoard {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [KablanColumnSchema], default: [] })
  columns: KablanColumn[];
}

export const KablanBoardSchema = SchemaFactory.createForClass(KablanBoard);
