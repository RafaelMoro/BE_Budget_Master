import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordsController } from './controllers/records.controller';
import { Record, RecordsSchema } from './entities/records.entity';
import { RecordsService } from './services/records.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Record.name,
        schema: RecordsSchema,
      },
    ]),
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
