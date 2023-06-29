import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Category extends Document {
  @Prop({ required: true, unique: true })
  categoryName: string;

  @Prop({ required: true })
  subCategories: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
