import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class DocDocument extends Document {
  @Prop({ required: true, index: true })
  path: string;

  @Prop()
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category: string;

  @Prop()
  type: 'markdown' | 'pdf' | 'audio' | 'image' | 'other';

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const DocDocumentSchema = SchemaFactory.createForClass(DocDocument);
