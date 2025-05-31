import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentationModule } from './documentation/documentation.module';
import { DocumentationSeeder } from './seeders/documentation.seeder';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost/forgeboard'
        ),
      }),
    }),
    DocumentationModule,
  ],
  providers: [DocumentationSeeder],
  exports: [DocumentationSeeder],
})
export class DatabaseModule {}
