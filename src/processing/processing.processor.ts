// src/processing/processing.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { TextractService } from './textract.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

@Processor('pdf-processing')
export class ProcessingProcessor {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('S3_CLIENT') private readonly s3: S3,
    private readonly textract: TextractService,
    private readonly ai: AiService,
  ) {}

  @Process('process')
  async handle(job: Job<{ documentId: string }>) {
    const { documentId } = job.data;

    // 1) Marcar como PROCESSING
    await this.prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // 2) Buscar metadados
    const doc = await this.prisma.pdfDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException(`Documento ${documentId} não encontrado`);
    }

    // 3) Baixar do S3 e extrair texto
    const obj = await this.s3
      .getObject({
        Bucket: process.env.S3_BUCKET_PDF!,
        Key: doc.s3Key,
      })
      .promise();
    const buffer = obj.Body as Buffer;
    const text = await this.textract.extractText(buffer);

    // 4) Chamar IA em paralelo
    const [summary, mindMap, questions] = await Promise.all([
      this.ai.generatePdfSummary(text),
      this.ai.generateMindMap(text),
      this.ai.generateQuestions(text, 10),
    ]);

    // 5) Gravar resultado
    await this.prisma.pdfResult.create({
      data: {
        documentId,
        extractedText: text,
        summary,
        mindMapJson: mindMap,
        questionsJson: questions,
      },
    });

    // 6) Marcar como DONE
    await this.prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: 'DONE' },
    });
  }
}
