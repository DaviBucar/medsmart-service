import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-uuid',
  name: 'João',
  email: 'joao@example.com',
  role: 'USER',
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
            userStudyProfile: {
              upsert: jest.fn().mockResolvedValue({ xp: 100 }),
            },
            userPreferences: {
              upsert: jest.fn().mockResolvedValue({ preferredStudyMethod: 'flashcards' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve retornar os dados do usuário logado', async () => {
    const result = await service.getMe(mockUser.id);
    expect(result).toBeDefined();
    expect(result.id).toBe(mockUser.id);
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });

  it('deve atualizar ou criar o perfil do usuário', async () => {
    const dto = {
      weakSubjects: ['Anatomia'],
      strongSubjects: ['Fisiologia'],
      accuracy: 0.85,
      xp: 100,
      studyHabitScore: 0.9,
    };
    const result = await service.updateProfile(mockUser.id, dto);
    expect(result.xp).toBe(100);
    expect(prisma.userStudyProfile.upsert).toHaveBeenCalled();
  });

  it('deve atualizar ou criar preferências do usuário', async () => {
    const dto = {
      preferredStudyMethod: 'flashcards',
      dailyGoal: 10,
      preferredTimeOfDay: 'noite',
    };
    const result = await service.updatePreferences(mockUser.id, dto);
    expect(result.preferredStudyMethod).toBe('flashcards');
    expect(prisma.userPreferences.upsert).toHaveBeenCalled();
  });
});
