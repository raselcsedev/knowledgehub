import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import { extname } from 'path';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentChunkingService } from './document-chunking.service';
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly chunkingService: DocumentChunkingService,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    let document;

    // 1. Save document metadata in PostgreSQL
    try {
      document = await this.prisma.document.create({
        data: {
          title: file.originalname.replace(/\.[^/.]+$/, ''),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storagePath: file.path,
          userId,
          status: 'UPLOADED',
        },
      });
    } catch (error) {
      // Remove physical file if database creation fails
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.error('File cleanup failed:', cleanupError);
      }

      throw error;
    }

    // 2. Mark document as processing
    await this.prisma.document.update({
      where: { id: document.id },
      data: { status: 'PROCESSING' },
    });

    // 3. Extract text and save it
    try {
      // 1. Extract document text
      const extractedText = await this.textExtractor.extractText(file.path);

      // 2. Split extracted text into chunks
      const chunks = this.chunkingService.splitText(extractedText);

      if (chunks.length === 0) {
        throw new Error('No chunks generated from document');
      }

      // 3. Save extracted text, chunks, and status together
      const updatedDocument = await this.prisma.$transaction(async (tx) => {
        // Remove old chunks if this document is processed again
        await tx.documentChunk.deleteMany({
          where: {
            documentId: document.id,
          },
        });

        // Save all generated chunks
        await tx.documentChunk.createMany({
          data: chunks.map((content, index) => ({
            documentId: document.id,
            content,
            chunkIndex: index,
            charCount: content.length,
          })),
        });

        // Mark document as ready
        return tx.document.update({
          where: {
            id: document.id,
          },
          data: {
            extractedText,
            processedAt: new Date(),
            status: 'READY',
          },
        });
      });

      return {
        message: 'Document uploaded, extracted and chunked successfully',
        document: updatedDocument,
        chunkCount: chunks.length,
      };
    } catch (error) {
      console.error('Document processing failed:', error);

      const failedDocument = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'FAILED',
        },
      });

      return {
        message: 'Document uploaded, but text extraction failed',
        document: failedDocument,
      };
    }
  }

  async findAllByUser(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Documents retrieved successfully',
      documents,
    };
  }

  async countByUser(userId: string) {
    return this.prisma.document.count({
      where: {
        userId,
      },
    });
  }

  async findOneByUser(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      message: 'Document retrieved successfully',
      document,
    };
  }

    async findChunksByUser(documentId: string, userId: string) {
    // First verify document ownership
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Retrieve chunks in their original order
    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        documentId: document.id,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
      select: {
        id: true,
        content: true,
        chunkIndex: true,
        charCount: true,
        createdAt: true,
      },
    });

    return {
      message: 'Document chunks retrieved successfully',
      document,
      chunkCount: chunks.length,
      chunks,
    };
  }

  async remove(documentId: string, userId: string) {
    const result = await this.prisma.document.deleteMany({
      where: {
        id: documentId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Document not found');
    }

    return {
      message: 'Document deleted successfully',
    };
  }
}
