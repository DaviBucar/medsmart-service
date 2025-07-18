import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: PrismaService;
  let aiService: AiService;

  const sessionDb = {
    id: 's1',
    userId: 'u1',
    topics: ['T1'],
    startedAt: new Date('2025-07-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            userSession: {
              create: jest.fn().mockResolvedValue(sessionDb),
              findUnique: jest.fn().mockResolvedValue(sessionDb),
              update: jest.fn().mockResolvedValue({ ...sessionDb, aiSummary: 'X' }),
              findMany: jest.fn().mockResolvedValue([sessionDb]),
            },
            user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1' }) },
            questionInteraction: {
              create: jest.fn().mockResolvedValue({}),
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: AiService,
          useValue: { generateSessionFeedback: jest.fn().mockResolvedValue('FEEDBACK') },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  it('startSession should create a session', async () => {
    const dto = { topics: ['A','B'] };
    const result = await service.startSession('u1', dto);
    expect(prisma.userSession.create).toHaveBeenCalled();
    expect(result).toEqual(sessionDb);
  });

  it('endSession should throw if not found', async () => {
    prisma.userSession.findUnique = jest.fn().mockResolvedValue(null);
    await expect(service.endSession('bad', { score:1, mistakes:0, aiSummary:'' }))
      .rejects.toThrow(NotFoundException);
  });

  it('endSession should update, call AI and update again', async () => {
    const dto = { score: 5, mistakes: 2, aiSummary: '' };
    const updated = await service.endSession('s1', dto);
    expect(prisma.userSession.update).toHaveBeenCalledTimes(2);
    expect(aiService.generateSessionFeedback).toHaveBeenCalled();
    expect(updated.aiSummary).toBe('FEEDBACK');
  });

  it('logInteraction should create interaction', async () => {
    const dto = { questionId:'q1', correct:true, selectedOption:'A', timeSpent:10 };
    await service.logInteraction('u1', dto);
    expect(prisma.questionInteraction.create).toHaveBeenCalled();
  });

  it('listUserSessions should return array', async () => {
    const res = await service.listUserSessions('u1');
    expect(Array.isArray(res)).toBe(true);
  });

  it('listUserInteractions should return array', async () => {
    const res = await service.listUserInteractions('u1');
    expect(Array.isArray(res)).toBe(true);
  });
});
