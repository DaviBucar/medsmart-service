import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { QuestionsModule } from './questions/questions.module';
import { AiModule } from './ai/ai.module';
import { OcrModule } from './ocr/ocr.module';
import { FilesModule } from './files/files.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DocumentsModule } from './documents/documents.module';
import { ProcessingModule } from './processing/processing.module';

const redisUrl = new URL(process.env.REDIS_URL!);

@Module({
  imports: [AuthModule, UsersModule, SessionsModule, QuestionsModule, AiModule, OcrModule, FilesModule, AdminModule, ConfigModule.forRoot({ isGlobal: true }),BullModule.forRoot({
      redis: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port),
        ...(redisUrl.password ? { password: redisUrl.password } : {}),
      },
    }),
    DocumentsModule,
    ProcessingModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
