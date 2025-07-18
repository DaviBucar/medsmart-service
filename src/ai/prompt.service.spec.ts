import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from './prompt.service';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('PromptService', () => {
  const templatePath = join(process.cwd(), 'prompts/sessionFeedback.template.txt');
  const sampleTemplate = `
Usuário: {{userId}}
Tópicos estudados: {{topics}}
Perfil — Fracos: {{weakSubjects}}, Fortes: {{strongSubjects}}
  `;

  beforeAll(() => {
    writeFileSync(templatePath, sampleTemplate, 'utf8');
  });

  afterAll(() => {
    unlinkSync(templatePath);
  });

  let service: PromptService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptService],
    }).compile();
    service = module.get<PromptService>(PromptService);
  });

  it('should replace placeholders correctly', () => {
    const prompt = service.buildSessionFeedbackPrompt(
      {
        userId: 'u1',
        topics: ['A', 'B'],
        score: 5,
        mistakes: 2,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      { weakSubjects: ['X'], strongSubjects: ['Y'] },
    );
    expect(prompt).toContain('Usuário: u1');
    expect(prompt).toContain('Tópicos estudados: A, B');
    expect(prompt).toContain('Fracos: X');
    expect(prompt).toContain('Fortes: Y');
  });

  it('should default empty arrays to "nenhum"', () => {
    const prompt = service.buildSessionFeedbackPrompt(
      {
        userId: 'u2',
        topics: ['C'],
        score: 3,
        mistakes: 1,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      { weakSubjects: [], strongSubjects: [] },
    );
    expect(prompt).toContain('Fracos: nenhum');
    expect(prompt).toContain('Fortes: nenhum');
  });
});
