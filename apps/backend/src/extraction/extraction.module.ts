import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [ExtractionController],
  providers: [ExtractionService, PrismaService],
})
export class ExtractionModule {}
