import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingProcessor } from './processing.processor';
import { PrismaService } from '../prisma/prisma.service';
import { TextractService } from './textract.service';
import { AiService } from '../ai/ai.service';
import { S3 } from 'aws-sdk';
import { NotFoundException } from '@nestjs/common';

describe('ProcessingProcessor', () => {
  let processor: ProcessingProcessor;
  let prisma: any;
  let s3: any;
  let textract: any;
  let ai: any;

  beforeEach(async () => {
    prisma = {
      pdfDocument: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      pdfResult: {
        create: jest.fn(),
      },
    };
    s3 = { getObject: jest.fn() };
    textract = { extractText: jest.fn() };
    ai = {
      generatePdfSummary: jest.fn(),
      generateMindMap: jest.fn(),
      generateQuestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: 'S3_CLIENT', useValue: s3 },
        { provide: TextractService, useValue: textract },
        { provide: AiService, useValue: ai },
      ],
    }).compile();

    processor = module.get(ProcessingProcessor);
  });

  it('deve lançar NotFoundException se pdfDocument não existir', async () => {
    prisma.pdfDocument.findUnique.mockResolvedValue(null);
    await expect(
      processor.handle({ data: { documentId: 'x' } } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fluxo completo deve chamar todos os serviços na ordem esperada', async () => {
    prisma.pdfDocument.findUnique.mockResolvedValue({ id: 'd1', s3Key: 'k1' });
    s3.getObject.mockReturnValue({ promise: () => Promise.resolve({ Body: Buffer.from('OK') }) });
    textract.extractText.mockResolvedValue('texto extraído');
    ai.generatePdfSummary.mockResolvedValue('sumário');
    ai.generateMindMap.mockResolvedValue({ nodes: [], edges: [] });
    ai.generateQuestions.mockResolvedValue([{ q: 1 }]);

    await processor.handle({ data: { documentId: 'd1' } } as any);

    // 1ª atualização: PROCESSING
    expect(prisma.pdfDocument.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { status: 'PROCESSING' },
    });

    // S3 e OCR
    expect(s3.getObject).toHaveBeenCalledWith({ Bucket: process.env.S3_BUCKET_PDF!, Key: 'k1' });

    expect(textract.extractText).toHaveBeenCalledWith(Buffer.from('OK'));

    // IA
    expect(ai.generatePdfSummary).toHaveBeenCalledWith('texto extraído');
    expect(ai.generateMindMap).toHaveBeenCalledWith('texto extraído');
    expect(ai.generateQuestions).toHaveBeenCalledWith('texto extraído', 10);

    // grava resultado
    expect(prisma.pdfResult.create).toHaveBeenCalledWith({
      data: {
        documentId: 'd1',
        extractedText: 'texto extraído',
        summary: 'sumário',
        mindMapJson: { nodes: [], edges: [] },
        questionsJson: [{ q: 1 }],
      },
    });

    // 2ª atualização: DONE
    expect(prisma.pdfDocument.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { status: 'DONE' },
    });
  });
});
