import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pdf-processing') private readonly pdfQueue: Queue,
  ) {}

  async createDocument(userId: string, s3Key: string) {
    const doc = await this.prisma.pdfDocument.create({
      data: { userId, s3Key, status: 'PENDING' },
    });
    await this.pdfQueue.add('process', { documentId: doc.id });
    return { id: doc.id, status: doc.status };
  }

  async getResult(id: string) {
    const doc = await this.prisma.pdfDocument.findUnique({ where: { id } });
    if (!doc) return null;
    const res = await this.prisma.pdfResult.findUnique({ where: { documentId: id } });
    return {
      id,
      status: doc.status,
      ...(res && {
        extractedText: res.extractedText,
        summary: res.summary,
        mindMap: res.mindMapJson,
        questions: res.questionsJson,
      }),
    };
  }
  
}
