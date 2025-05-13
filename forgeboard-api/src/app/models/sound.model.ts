import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Sound extends Document {
  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  path: string;

  @Prop({ default: true })
  required: boolean;

  @Prop({ default: false })
  exists: boolean;

  @Prop({ default: false })
  isFallback: boolean;

  @Prop({ default: false })
  inUse: boolean;

  @Prop()
  lastChecked?: Date;

  @Prop()
  lastUsed?: Date;

  @Prop({ default: Date.now })
  created: Date;
}

export const SoundSchema = SchemaFactory.createForClass(Sound);
