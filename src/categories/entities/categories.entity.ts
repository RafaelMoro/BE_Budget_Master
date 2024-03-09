import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/entities/users.entity';

@Schema()
export class Category extends Document {
  @Prop({ required: true, unique: true })
  categoryName: string;

  @Prop({ required: true })
  subCategories: string[];

  @Prop({ required: true })
  icon: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sub: User | Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
