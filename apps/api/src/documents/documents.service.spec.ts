import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentChunkingService } from './document-chunking.service';
import { EmbeddingsService } from './embeddings.service';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const prismaMock = {
    document: {
      findFirst: jest.fn(),
    },
    documentChunk: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const embeddingsMock = {
    generateEmbedding: jest.fn(),
    getModelName: jest.fn().mockReturnValue('mock-sha256-1536'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: DocumentTextExtractorService,
          useValue: {
            extractText: jest.fn(),
          },
        },
        {
          provide: DocumentChunkingService,
          useValue: {
            splitText: jest.fn(),
          },
        },
        {
          provide: EmbeddingsService,
          useValue: embeddingsMock,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('findChunksByUser', () => {
    const documentId = '67115c02-f028-4c53-b3e1-fd4638d6c423';
    const userId = 'user-123';

    it('should retrieve chunks belonging to the authenticated user', async () => {
      const document = {
        id: documentId,
        title: 'Writing - July',
      };

      const chunks = [
        {
          id: 'chunk-1',
          content: 'First chunk content',
          chunkIndex: 0,
          charCount: 19,
          createdAt: new Date(),
        },
        {
          id: 'chunk-2',
          content: 'Second chunk content',
          chunkIndex: 1,
          charCount: 20,
          createdAt: new Date(),
        },
      ];

      prismaMock.document.findFirst.mockResolvedValue(document);
      prismaMock.documentChunk.findMany.mockResolvedValue(chunks);

      const result = await service.findChunksByUser(documentId, userId);

      expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: documentId,
          userId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      expect(prismaMock.documentChunk.findMany).toHaveBeenCalledWith({
        where: {
          documentId,
        },
        orderBy: {
          chunkIndex: 'asc',
        },
        select: {
          id: true,
          content: true,
          chunkIndex: true,
          charCount: true,
          embeddingModel: true,
          embeddedAt: true,
          createdAt: true,
        },
      });

      expect(result.chunkCount).toBe(2);
      expect(result.chunks).toEqual([
        {
          ...chunks[0],
          hasEmbedding: true,
        },
        {
          ...chunks[1],
          hasEmbedding: true,
        },
      ]);
      expect(result.document).toEqual(document);
    });

    it('should throw NotFoundException if document does not belong to the user', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      await expect(
        service.findChunksByUser(documentId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.documentChunk.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array when the document has no chunks', async () => {
      prismaMock.document.findFirst.mockResolvedValue({
        id: documentId,
        title: 'Empty Document',
      });

      prismaMock.documentChunk.findMany.mockResolvedValue([]);

      const result = await service.findChunksByUser(documentId, userId);

      expect(result.chunkCount).toBe(0);
      expect(result.chunks).toEqual([]);
    });
  });

  describe('generateDocumentEmbedding', () => {
    const documentId = 'document-123';
    const userId = 'user-123';

    const document = {
      id: documentId,
      title: 'Writing - July',
    };

    const chunks = [
      {
        id: 'chunk-1',
        content: 'First chunk content',
        chunkIndex: 0,
      },
      {
        id: 'chunk-2',
        content: 'Second chunk content',
        chunkIndex: 1,
      },
    ];

    const mockEmbedding = Array(1536).fill(0.25);

    beforeEach(() => {
      prismaMock.document.findFirst.mockResolvedValue(document);
      prismaMock.documentChunk.findMany.mockResolvedValue(chunks);
      prismaMock.documentChunk.update.mockResolvedValue({});
      embeddingsMock.generateEmbedding.mockResolvedValue(mockEmbedding);
    });

    it('should generate and persist embeddings for every chunk', async () => {
      const result = await service.generateDocumentEmbedding(
        documentId,
        userId,
      );

      expect(embeddingsMock.generateEmbedding).toHaveBeenCalledTimes(2);

      expect(prismaMock.documentChunk.update).toHaveBeenCalledTimes(2);

      expect(prismaMock.documentChunk.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'chunk-1' },
        data: {
          embedding: mockEmbedding,
          embeddingModel: 'mock-sha256-1536',
          embeddedAt: expect.any(Date),
        },
      });

      expect(prismaMock.documentChunk.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'chunk-2' },
        data: {
          embedding: mockEmbedding,
          embeddingModel: 'mock-sha256-1536',
          embeddedAt: expect.any(Date),
        },
      });

      expect(result.totalChunks).toBe(2);
      expect(result.processedChunks).toBe(2);
      expect(result.storedChunks).toBe(2);
      expect(result.embeddings.every((item) => item.stored)).toBe(true);
    });

    it('should reject if the document does not belong to the user', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      await expect(
        service.generateDocumentEmbedding(documentId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.documentChunk.findMany).not.toHaveBeenCalled();
      expect(embeddingsMock.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should reject if the document has no chunks', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue([]);

      await expect(
        service.generateDocumentEmbedding(documentId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(embeddingsMock.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should not report success if embedding generation fails', async () => {
      embeddingsMock.generateEmbedding.mockRejectedValue(
        new Error('Embedding generation failed'),
      );

      await expect(
        service.generateDocumentEmbedding(documentId, userId),
      ).rejects.toThrow('Embedding generation failed');

      expect(prismaMock.documentChunk.update).not.toHaveBeenCalled();
    });
  });
});
