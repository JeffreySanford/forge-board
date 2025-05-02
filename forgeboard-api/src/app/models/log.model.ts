import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Log extends Document {
  @Prop({ required: true })
  level: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  source?: string;

  @Prop()
  context?: string;

  @Prop()
  tags?: string[];
}

export const LogSchema = SchemaFactory.createForClass(Log);
