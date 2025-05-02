import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@forge-board/shared/api-interfaces';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  }
})
export class User {
  @Prop({ required: true, unique: true })
  id: string;
  
  @Prop({ required: true, unique: true })
  username: string;
  
  @Prop({ 
    required: true, 
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  })
  role: UserRole;
  
  @Prop()
  email?: string;
  
  @Prop()
  passwordHash?: string;
  
  @Prop()
  lastLogin?: string;
  
  @Prop()
  guestExpiry?: string;
  
  @Prop({ type: Object })
  preferences?: Record<string, unknown>;
}

export const UserSchema = SchemaFactory.createForClass(User);
