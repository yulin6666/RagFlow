import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { ExtractionModule } from './extraction/extraction.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../../.env.local',
        '../../.env',
        '.env.local',
        '.env',
      ],
    }),
    DocumentsModule,
    ChatModule,
    ExtractionModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
