// documents.controller.spec
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: Partial<DocumentsService>;

  beforeEach(async () => {
    service = {
      createDocument: jest.fn().mockResolvedValue({ id: 'docX', status: 'PENDING' }),
      getResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: service }],
    }).compile();

    controller = module.get(DocumentsController);
  });

  describe('upload', () => {
    it('deve lançar BadRequestException se não houver file.key', async () => {
      await expect(controller.upload({ user: { id: 'u1' } } as any, {} as any))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve chamar service.createDocument quando file.key presente', async () => {
      const fakeFile = { key: 'path.pdf' } as any;
      const res = await controller.upload({ user: { id: 'u1' } } as any, fakeFile);
      expect(service.createDocument).toHaveBeenCalledWith('u1', 'path.pdf');
      expect(res).toEqual({ id: 'docX', status: 'PENDING' });
    });
  });

  describe('get', () => {
    it('deve lançar NotFoundException se getResult retornar null', async () => {
      (service.getResult as jest.Mock).mockResolvedValue(null);
      await expect(controller.get('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve retornar o DTO quando existir', async () => {
      const dto = { id: 'doc1', status: 'DONE', summary: 'ok' };
      (service.getResult as jest.Mock).mockResolvedValue(dto);
      await expect(controller.get('doc1')).resolves.toEqual(dto);
    });
  });
});
