// ai.service.spec
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { HttpService } from '@nestjs/axios';
import { PromptService } from './prompt.service';
import { PrismaService } from '../prisma/prisma.service';
import { of } from 'rxjs';

describe('AiService', () => {
  let service: AiService;
  let httpService: HttpService;
  let prisma: PrismaService;
  let promptService: PromptService;

  const fakeProfile = { weakSubjects: ['X'], strongSubjects: ['Y'] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: HttpService,
          useValue: { post: jest.fn() },
        },
        {
          provide: PromptService,
          useValue: {
            buildSessionFeedbackPrompt: jest.fn().mockReturnValue('PROMPT_TEXT'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            userStudyProfile: { findUnique: jest.fn().mockResolvedValue(fakeProfile) },
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    httpService = module.get<HttpService>(HttpService);
    prisma = module.get<PrismaService>(PrismaService);
    promptService = module.get<PromptService>(PromptService);
    process.env.DEEPSEEK_URL = 'http://fake.url';
    process.env.DEEPSEEK_API_KEY = 'FAKEKEY';
  });

  it('should call PromptService and HttpService and return text', async () => {
    const fakeResponse = { data: { text: 'RESULT' } };
    (httpService.post as jest.Mock).mockReturnValueOnce(of(fakeResponse));

    const result = await service.generateSessionFeedback({
      userId: 'u1',
      topics: ['A'],
      score: 1,
      mistakes: 0,
      startedAt: new Date('2025-07-01T00:00:00Z'),
      endedAt: new Date('2025-07-01T00:10:00Z'),
    });

    expect(prisma.userStudyProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(promptService.buildSessionFeedbackPrompt).toHaveBeenCalled();
    expect(httpService.post).toHaveBeenCalledWith(
      'http://fake.url',
      { prompt: 'PROMPT_TEXT' },
      { headers: { Authorization: 'Bearer FAKEKEY' } },
    );
    expect(result).toBe('RESULT');
  });

  it('should throw if env vars missing', async () => {
    delete process.env.DEEPSEEK_URL;
    await expect(
      service.generateSessionFeedback({
        userId: 'u1',
        topics: ['A'],
        score: 1,
        mistakes: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      }),
    ).rejects.toThrow('DEEPSEEK_URL não configurada');
  });
});

describe('AiService (stub)', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get(AiService);
  });

  it('generatePdfSummary deve truncar texto', async () => {
    const txt = 'a'.repeat(200);
    const sum = await service.generatePdfSummary(txt);
    expect(sum).toMatch(/^Resumo \(stub\): a{100}\.\.\./);
  });

  it('generateMindMap retorna objeto com nodes e edges', async () => {
    const mm = await service.generateMindMap('qualquer');
    expect(mm).toHaveProperty('nodes');
    expect(mm).toHaveProperty('edges');
  });

  it('generateQuestions retorna array do tamanho correto', async () => {
    const qs = await service.generateQuestions('t', 5);
    expect(Array.isArray(qs)).toBe(true);
    expect(qs).toHaveLength(5);
    qs.forEach((q, i) => {
      expect(q).toHaveProperty('question', `Questão ${i + 1}`);
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('answer');
    });
  });
});
