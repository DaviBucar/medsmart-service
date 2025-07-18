import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import {PromptRegistry } from './prompt-registry';

interface SessionData {
  userId: string;
  topics: string[];
  score: number;
  mistakes: number;
  startedAt: Date;
  endedAt: Date;
}

interface ProfileData {
  weakSubjects: string[];
  strongSubjects: string[];
}

@Injectable()
export class PromptService {
  private tpl: Handlebars.TemplateDelegate;
  private readonly logger = new Logger(PromptService.name);

  constructor(private readonly registry: PromptRegistry) {
    try {

      const src = readFileSync(
        join(process.cwd(), 'prompts/sessionFeedback.template.txt'),
        'utf8',
      );
      this.tpl = Handlebars.compile(src);
    } catch (err) {
      this.logger.warn(
        'Template de prompt não encontrado; usando template vazio',
      );
      this.tpl = Handlebars.compile('{{> noop}}');
    }
  }

  buildSessionFeedbackPrompt(
    session: SessionData,
    profile: ProfileData,
  ): string {
    Handlebars.registerPartial('noop', '');
    const duration = Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
    );

    return this.tpl({
      userId: session.userId,
      topics: session.topics.join(', '),
      score: session.score,
      mistakes: session.mistakes,
      duration,
      weakSubjects:
        profile.weakSubjects.length > 0
          ? profile.weakSubjects.join(', ')
          : 'nenhum',
      strongSubjects:
        profile.strongSubjects.length > 0
          ? profile.strongSubjects.join(', ')
          : 'nenhum',
    });
  }

  buildRecallPracticePrompt(content: string): string {
    return this.registry.getPrompt('recallPractice', { content });
  }

  buildElaborativeInterrogationPrompt(content: string): string {
    return this.registry.getPrompt('elaborativeInterrogation', { content });
  }
}
