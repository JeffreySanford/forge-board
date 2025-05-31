import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let uri = configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/forge-board'
        );
        if (configService.get<string>('USE_IN_MEMORY_MONGO') === 'true') {
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
          console.log('[MongoMemoryServer] Started in-memory MongoDB at', uri);
        }
        return {
          uri,
          // No need for deprecated options with MongoDB driver v4.0+
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
