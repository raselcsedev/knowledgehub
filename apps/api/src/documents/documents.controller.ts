import {
  BadRequestException,
  Controller,
  Get,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import type { Request } from 'express';

import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILES = [
  {
    extension: '.pdf',
    mimeType: 'application/pdf',
  },
  {
    extension: '.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
];

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();

          callback(null, `${randomUUID()}${extension}`);
        },
      }),
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/octet-stream',
        ];

        const hasAllowedExtension = ['.pdf', '.docx'].includes(extension);
        const hasAllowedMimeType = allowedMimeTypes.includes(file.mimetype);

        if (!hasAllowedExtension || !hasAllowedMimeType) {
          return callback(
            new BadRequestException('Only PDF and DOCX files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    if (!file) {
      throw new BadRequestException('Please select a file');
    }

    return this.documentsService.upload(file, request.user.id);
  }

  @Get()
  async findAll(
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.findAllByUser(request.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.findOneByUser(documentId, request.user.id);
  }

  @Get(':id/chunks')
  async findChunks(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.findChunksByUser(documentId, request.user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.remove(documentId, request.user.id);
  }

  @Post(':id/embed')
  async generateEmbedding(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Req()
    request: Request & {
      user: { id: string; email: string };
    },
  ) {
    return this.documentsService.generateDocumentEmbedding(
      documentId,
      request.user.id,
    );
  }
}
