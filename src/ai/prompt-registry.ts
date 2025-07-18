import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

interface PromptTemplates {
  [key: string]: string;
}

@Injectable()
export class PromptRegistry implements OnModuleInit {
  private readonly logger = new Logger(PromptRegistry.name);
  private templates: Record<string, Handlebars.TemplateDelegate> = {};

  onModuleInit() {
    const filePath = path.resolve(__dirname, 'prompts.json');
    let raw: PromptTemplates;
    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      this.logger.error(`Não foi possível ler prompts.json: ${err.message}`);
      throw err;
    }

    for (const [key, tpl] of Object.entries(raw)) {
      try {
        this.templates[key] = Handlebars.compile(tpl);
      } catch (err) {
        this.logger.error(`Falha ao compilar prompt "${key}": ${err.message}`);
      }
    }
    this.logger.log(`Loaded ${Object.keys(this.templates).length} prompt templates`);
  }

  getPrompt(key: string, data: object): string {
    const tpl = this.templates[key];
    if (!tpl) {
      throw new Error(`Prompt template "${key}" não encontrado`);
    }
    return tpl(data);
  }
}
