import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  middleName: string;
}

export interface ForgotPasswordPayload {
  oneTimeToken: string;
  hostname: string;
  user: User;
}

export const UsersSchema = SchemaFactory.createForClass(User);
