import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/entities/users.entity';

@Schema()
export class Account extends Document {
  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  accountType: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sub: User | Types.ObjectId;
}

export const AccountsSchema = SchemaFactory.createForClass(Account);
