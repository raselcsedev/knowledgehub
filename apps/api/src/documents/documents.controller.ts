import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  async findAll(
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.findAllByUser(
      request.user.id,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.findOneByUser(
      documentId,
      request.user.id,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.remove(
      documentId,
      request.user.id,
    );
  }
}