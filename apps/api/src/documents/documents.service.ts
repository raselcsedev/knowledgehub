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
import { EmbeddingsService } from './embeddings.service';
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async generateDocumentEmbeddings(documentId: string, userId: string) {
    // Verify document ownership
    // Retrieve document chunks
    // Generate embeddings
    // Return embedding information
  }

  async generateDocumentEmbedding(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true, title: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId: document.id },
      orderBy: { chunkIndex: 'asc' },
    });

    if (chunks.length === 0) {
      throw new NotFoundException('No chunks found for this document');
    }

    const results = [];

    for (const chunk of chunks) {
      // Generate embedding
      const embedding = await this.embeddingsService.generateEmbedding(
        chunk.content,
      );

      // Persist embedding in PostgreSQL JSONB
      await this.prisma.documentChunk.update({
        where: { id: chunk.id },
        data: {
          embedding,
          embeddingModel: this.embeddingsService.getModelName(),
          embeddedAt: new Date(),
        },
      });

      results.push({
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
        dimensions: embedding.length,
        stored: true,
        preview: embedding.slice(0, 5),
      });
    }

    return {
      message: 'Document embeddings generated and stored successfully',
      document: {
        id: document.id,
        title: document.title,
      },
      totalChunks: chunks.length,
      processedChunks: results.length,
      storedChunks: results.filter((item) => item.stored).length,
      embeddings: results,
    };
  }

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
      console.log('Document ID:', document.id);
      console.log('Extracted text length:', extractedText.length);
      console.log('Generated chunks:', chunks.length);

      if (chunks.length === 0) {
        throw new Error('No chunks generated from document');
      }

      // 3. Save extracted text, chunks, and status together
      const updatedDocument = await this.prisma.$transaction(async (tx) => {
        // Remove old chunks
        const deletedChunks = await tx.documentChunk.deleteMany({
          where: {
            documentId: document.id,
          },
        });

        console.log('Deleted chunk records:', deletedChunks.count);

        // Confirm no old chunks remain
        const remainingChunks = await tx.documentChunk.count({
          where: {
            documentId: document.id,
          },
        });

        console.log('Remaining chunks:', remainingChunks);

        // Insert chunks exactly once
        const result = await tx.documentChunk.createMany({
          data: chunks.map((content, index) => ({
            documentId: document.id,
            content,
            chunkIndex: index,
            charCount: content.length,
          })),
        });

        console.log('Saved chunk records:', result.count);

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
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chunks: true,
          },
        },
        chunks: {
          select: {
            embeddingModel: true,
            embeddedAt: true,
          },
        },
      },
    });

    const formattedDocuments = documents.map((document) => {
      const embeddedChunkCount = document.chunks.filter(
        (chunk) => chunk.embeddingModel !== null && chunk.embeddedAt !== null,
      ).length;

      const chunkCount = document._count.chunks;

      return {
        id: document.id,
        title: document.title,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        status: document.status,
        processedAt: document.processedAt,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        chunkCount,
        embeddedChunkCount,
        embeddingStatus:
          chunkCount === 0
            ? 'NOT_AVAILABLE'
            : embeddedChunkCount === 0
              ? 'NOT_EMBEDDED'
              : embeddedChunkCount === chunkCount
                ? 'COMPLETED'
                : 'PARTIAL',
      };
    });

    return {
      message: 'Documents retrieved successfully',
      documents: formattedDocuments,
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
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        extractedText: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
        chunks: {
          select: {
            embeddingModel: true,
            embeddedAt: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const chunkCount = document.chunks.length;

    const embeddedChunkCount = document.chunks.filter(
      (chunk) => chunk.embeddingModel !== null && chunk.embeddedAt !== null,
    ).length;

    const embeddingStatus =
      chunkCount === 0
        ? 'NOT_AVAILABLE'
        : embeddedChunkCount === 0
          ? 'NOT_EMBEDDED'
          : embeddedChunkCount === chunkCount
            ? 'COMPLETED'
            : 'PARTIAL';

    const { chunks, ...documentDetails } = document;

    return {
      message: 'Document retrieved successfully',
      document: {
        ...documentDetails,
        chunkCount,
        embeddedChunkCount,
        embeddingStatus,
      },
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
        embeddingModel: true,
        embeddedAt: true,
      },
    });

    return {
      message: 'Document chunks retrieved successfully',
      document,
      chunkCount: chunks.length,
      chunks: chunks.map((chunk) => ({
        ...chunk,
        hasEmbedding:
          chunk.embeddingModel !== null && chunk.embeddedAt !== null,
      })),
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
