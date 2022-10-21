import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
}

export interface ForgotPasswordPayload {
  oneTimeToken: string;
  hostname: string;
  user: User;
}

export const UsersSchema = SchemaFactory.createForClass(User);
