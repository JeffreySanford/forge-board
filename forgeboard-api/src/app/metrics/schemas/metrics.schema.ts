import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MetricsData } from '@forge-board/shared/api-interfaces';

export type MetricsDocument = Metrics & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  }
})
export class Metrics implements MetricsData {
  @Prop({ required: true })
  id: string;
  
  @Prop({ required: true })
  timestamp: string;
  
  @Prop({ required: true })
  cpu: number;
  
  @Prop({ required: true })
  memory: number;
  
  @Prop({ required: true })
  disk: number;
  
  @Prop({ required: true })
  network: number;
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
