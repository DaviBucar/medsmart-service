// documents.service.spec
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: Partial<Record<keyof PrismaService, any>>;
  let queue: Partial<Queue>;

  beforeEach(async () => {
    prisma = {
      pdfDocument: {
        create: jest.fn().mockResolvedValue({ id: 'doc1', status: 'PENDING' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      pdfResult: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    queue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('pdf-processing'), useValue: queue },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  describe('createDocument', () => {
    it('deve criar o documento e enfileirar o job', async () => {
      const result = await service.createDocument('user1', 'key1.pdf');

      expect(prisma.pdfDocument.create).toHaveBeenCalledWith({
        data: { userId: 'user1', s3Key: 'key1.pdf', status: 'PENDING' },
      });
      expect(queue.add).toHaveBeenCalledWith('process', { documentId: 'doc1' });
      expect(result).toEqual({ id: 'doc1', status: 'PENDING' });
    });
  });

  describe('getResult', () => {
    it('deve retornar null se documento não existir', async () => {
      prisma.pdfDocument.findUnique.mockResolvedValue(null);
      const res = await service.getResult('nonexistent');
      expect(res).toBeNull();
    });

    it('deve retornar apenas id e status se ainda não processado', async () => {
      prisma.pdfDocument.findUnique.mockResolvedValue({ id: 'doc1', status: 'PENDING' });
      prisma.pdfResult.findUnique.mockResolvedValue(null);

      const res = await service.getResult('doc1');
      expect(res).toEqual({ id: 'doc1', status: 'PENDING' });
    });

    it('deve retornar todos os campos se já houver resultado', async () => {
      prisma.pdfDocument.findUnique.mockResolvedValue({ id: 'doc1', status: 'DONE' });
      prisma.pdfResult.findUnique.mockResolvedValue({
        extractedText: 'texto',
        summary: 'resumo',
        mindMapJson: { nodes: [] },
        questionsJson: [{ question: 'q1' }],
      });

      const res = await service.getResult('doc1');
      expect(res).toEqual({
        id: 'doc1',
        status: 'DONE',
        extractedText: 'texto',
        summary: 'resumo',
        mindMap: { nodes: [] },
        questions: [{ question: 'q1' }],
      });
    });
  });
});
