import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TileType } from '@forge-board/shared/api-interfaces';

@Schema({ collection: 'tile_states' })
export class TileState extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ type: [String], required: true })
  order: TileType[];

  @Prop({ type: Object, required: true })
  visibility: Record<TileType, boolean>;

  @Prop({ default: () => new Date().toISOString() })
  lastModified: string;
}

export const TileStateSchema = SchemaFactory.createForClass(TileState);
