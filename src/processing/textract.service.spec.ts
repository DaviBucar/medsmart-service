// textract.service.spec
import { Test, TestingModule } from '@nestjs/testing';
import { TextractService } from './textract.service';
import { Textract } from 'aws-sdk';
import { InternalServerErrorException } from '@nestjs/common';

describe('TextractService', () => {
  let service: TextractService;
  let detectMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextractService],
    }).compile();

    service = module.get(TextractService);
    detectMock = jest.spyOn(Textract.prototype, 'detectDocumentText');
  });

  it('deve extrair e concatenar apenas blocos LINE', async () => {
    detectMock.mockReturnValueOnce({
      promise: () =>
        Promise.resolve({
          Blocks: [
            { BlockType: 'PAGE', Text: 'ignore' },
            { BlockType: 'LINE', Text: 'linha1' },
            { BlockType: 'LINE', Text: 'linha2' },
          ],
        }),
    } as any);

    const text = await service.extractText(Buffer.from(''));
    expect(text).toBe('linha1\nlinha2');
  });

  it('deve usar array vazio se Blocks undefined e retornar string vazia', async () => {
    detectMock.mockReturnValueOnce({
      promise: () => Promise.resolve({ /* Blocks omitido */ }),
    } as any);

    const text = await service.extractText(Buffer.from(''));
    expect(text).toBe('');
  });

  it('deve lançar InternalServerErrorException em falha do Textract', async () => {
    detectMock.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('fail')),
    } as any);

    await expect(service.extractText(Buffer.from(''))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
