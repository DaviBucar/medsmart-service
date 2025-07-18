// src/processing/processing.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProcessingProcessor } from './processing.processor';
import { PrismaService } from '../prisma/prisma.service';
import { S3ClientProvider } from '../common/providers/s3.provider';
import { TextractService } from './textract.service';
import { AiService } from '../ai/ai.service';
import { S3Module } from '../common/providers/s3.provider';
import { HttpModule } from '@nestjs/axios';
import { PromptService } from '../ai/prompt.service';

@Module({
  imports: [
    S3Module,
    HttpModule,
    BullModule.registerQueue({ name: 'pdf-processing' }),
  ],
  providers: [
    ProcessingProcessor,
    PrismaService,
    S3ClientProvider,
    TextractService,
    PromptService, 
    AiService
  ],
})
export class ProcessingModule {}
