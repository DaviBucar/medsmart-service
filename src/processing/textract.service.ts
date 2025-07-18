// src/processing/textract.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Textract } from 'aws-sdk';

@Injectable()
export class TextractService {
  private readonly client = new Textract({ region: process.env.AWS_REGION });

  async extractText(buffer: Buffer): Promise<string> {
    try {
      const res = await this.client
        .detectDocumentText({
          Document: { Bytes: buffer },
        })
        .promise();
      const blocks = res.Blocks ?? [];
      return blocks
        .filter((b) => b.BlockType === 'LINE')
        .map((b) => b.Text)
        .join('\n');
    } catch (err) {
      throw new InternalServerErrorException('Falha no OCR via Textract');
    }
  }
}
