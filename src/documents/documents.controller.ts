import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit } from 'nestjs-rate-limiter';
import { DocumentsService } from './documents.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('documents/pdf')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly docService: DocumentsService) {}

  @Post()
  @RateLimit({ points: Number(process.env.UPLOAD_RATE_LIMIT), duration: 60 })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req, @UploadedFile() file: Express.MulterS3.File) {
    if (!file?.key) throw new BadRequestException('Falha no upload');
    return this.docService.createDocument(req.user.id, file.key);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const dto = await this.docService.getResult(id);
    if (!dto) throw new NotFoundException();
    return dto;
  }
}
