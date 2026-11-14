
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AskQuestionDto } from './dto/ask-question.dto';
import { QaService } from './qa.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('qa')
@UseGuards(JwtAuthGuard)
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  async askQuestion(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AskQuestionDto,
  ) {
    const userId = req.user.sub;

    return this.qaService.askQuestion(userId, dto);
  }
}
