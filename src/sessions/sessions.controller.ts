import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogInteractionDto } from './dto/log-interaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post('start')
  start(@Req() req, @Body() dto: StartSessionDto) {
    return this.service.startSession(req.user.id, dto);
  }

  @Patch('end/:id')
  end(@Param('id') id: string, @Body() dto: EndSessionDto) {
    return this.service.endSession(id, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getSession(id);
  }

  @Get('me/history')
  history(@Req() req) {
    return this.service.listUserSessions(req.user.id);
  }

  @Post('interactions')
  log(@Req() req, @Body() dto: LogInteractionDto) {
    return this.service.logInteraction(req.user.id, dto);
  }

  @Get('interactions/me')
  interactions(@Req() req) {
    return this.service.listUserInteractions(req.user.id);
  }
}
