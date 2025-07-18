import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { PromptService } from './prompt.service';

@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly promptService: PromptService,
  ) {}

  async generateSessionFeedback(session: {
    userId: string;
    topics: string[];
    score: number;
    mistakes: number;
    startedAt: Date;
    endedAt: Date;
  }): Promise<string> {
    // 1) Validar variáveis de ambiente ANTES de usar
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'DEEPSEEK_API_KEY não configurada',
      );
    }
    const url = process.env.DEEPSEEK_URL;
    if (!url) {
      throw new InternalServerErrorException('DEEPSEEK_URL não configurada');
    }

    const profile = await this.prisma.userStudyProfile.findUnique({
      where: { userId: session.userId },
    });
    const durationMin = Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
    );

    const prompt = this.promptService.buildSessionFeedbackPrompt(session, {
      weakSubjects: profile?.weakSubjects || [],
      strongSubjects: profile?.strongSubjects || [],
    });

    try {
      const response = await firstValueFrom(
        this.http.post(
          url,
          { prompt },
          { headers: { Authorization: `Bearer ${apiKey}` } },
        ),
      );
      return response.data.text;
    } catch (err) {
      throw new InternalServerErrorException('Falha ao gerar feedback via IA');
    }
  }

   async generatePdfSummary(text: string): Promise<string> {
    return `Resumo (stub): ${text.slice(0, 100)}...`;
  }

  async generateMindMap(text: string): Promise<any> {
    return { nodes: [], edges: [] };
  }

  async generateQuestions(text: string, count: number): Promise<any[]> {
    return Array.from({ length: count }, (_, i) => ({
      question: `Questão ${i + 1}`,
      options: ['A','B','C','D'],
      answer: 'A',
    }));
  }
}
