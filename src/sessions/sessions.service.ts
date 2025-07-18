import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogInteractionDto } from './dto/log-interaction.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async startSession(userId: string, dto: StartSessionDto) {
    const now = new Date();
    return this.prisma.userSession.create({
      data: {
        user: { connect: { id: userId } },
        startedAt: now,
        topics: dto.topics,
        endedAt: now,
        score: 0,
        mistakes: 0,
        aiSummary: '',
      },
    });
  }

  async endSession(sessionId: string, dto: EndSessionDto) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    // 1) Fecha a sessão no banco
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        score: dto.score,
        mistakes: dto.mistakes,
        aiSummary: '', // placeholder
      },
    });

    // 2) Gera feedback via IA
    const feedback = await this.aiService.generateSessionFeedback({
      userId: session.userId,
      topics: session.topics,
      score: dto.score,
      mistakes: dto.mistakes,
      startedAt: session.startedAt,
      endedAt: new Date(),
    });

    // 3) Atualiza o resumo no banco
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { aiSummary: feedback },
    });

    // 4) Retorna um objeto construído manualmente
    return {
      ...session,
      endedAt: new Date(),
      score: dto.score,
      mistakes: dto.mistakes,
      aiSummary: feedback,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    return session;
  }

  async listUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async logInteraction(userId: string, dto: LogInteractionDto) {
    // garante que o usuário existe
    await this.prisma.user.findUnique({ where: { id: userId } });

    return this.prisma.questionInteraction.create({
      data: {
        user: { connect: { id: userId } },
        questionId: dto.questionId,
        answeredAt: new Date(),
        selectedOption: dto.selectedOption,
        correct: dto.correct,
        timeSpent: dto.timeSpent,
      },
    });
  }

  async listUserInteractions(userId: string) {
    return this.prisma.questionInteraction.findMany({
      where: { userId },
      orderBy: { answeredAt: 'desc' },
    });
  }
}
