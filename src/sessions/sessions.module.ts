import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService],
  imports: [AiModule]
})
export class SessionsModule {}
