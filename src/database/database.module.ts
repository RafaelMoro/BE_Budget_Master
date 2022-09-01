import { Module, Global, Inject } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigType } from '@nestjs/config';

import config from '../config';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigType<typeof config>) => {
        const { connection, user, password, cluster, mongoDbName } =
          configService.database;
        return {
          uri: `${connection}://${user}:${password}@${cluster}.q040o.mongodb.net/?retryWrites=true&w=majority`,
          user,
          pass: password,
          dbName: mongoDbName,
        };
      },
      inject: [config.KEY],
    }),
  ],
})
export class DatabaseModule {}
