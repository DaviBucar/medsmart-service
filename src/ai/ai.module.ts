import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromptService } from './prompt.service';
import { PromptRegistry } from './prompt-registry';

@Module({
  imports: [HttpModule],
  providers: [AiService, PrismaService, PromptService, PromptRegistry],
  exports: [AiService, PromptService, PromptRegistry],
})
export class AiModule {}
