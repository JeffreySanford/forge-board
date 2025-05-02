import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Diagnostic extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  service?: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;
}

export const DiagnosticSchema = SchemaFactory.createForClass(Diagnostic);
