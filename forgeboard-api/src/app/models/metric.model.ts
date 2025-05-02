import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Metric extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  source?: string;

  @Prop()
  cpu?: number;

  @Prop()
  memory?: number;

  @Prop()
  disk?: number;

  @Prop()
  network?: number;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);
