// src/documents/documents.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import * as multerS3 from 'multer-s3';
import { Request } from 'express';
import { BullModule } from '@nestjs/bull';   

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Module } from '../common/providers/s3.provider';  
@Module({
  imports: [
    S3Module,  
    RateLimiterModule.register({
      keyPrefix: 'upload_pdf',
      points: Number(process.env.UPLOAD_RATE_LIMIT),
      duration: 60,
    }),
    
    BullModule.registerQueue({ name: 'pdf-processing' }),

    MulterModule.registerAsync({
      imports: [S3Module],
      inject: ['S3_CLIENT'],
      useFactory: (s3Client) => {
        const bucket = process.env.S3_BUCKET_PDF;
        if (!bucket) {
          throw new Error('S3_BUCKET_PDF não está definida no .env');
        }
        return {
          storage: multerS3({
            s3: s3Client,
            bucket,
            acl: 'private',
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (req: Request, file, cb) => {
              const userId = (req as any).user.id;
              const filename = `pdfs/${userId}/${Date.now()}_${file.originalname}`;
              cb(null, filename);
            },
          }),
          limits: { fileSize: Number(process.env.MAX_PDF_SIZE) },
          fileFilter: (_req, file, cb) =>
            cb(null, file.mimetype === 'application/pdf'),
        };
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService],
})
export class DocumentsModule {}
