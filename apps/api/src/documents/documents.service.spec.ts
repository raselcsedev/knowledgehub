
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentChunkingService } from './document-chunking.service';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const prismaMock = {
    document: {
      findFirst: jest.fn(),
    },
    documentChunk: {
      findMany: jest.fn(),
    },
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
          createdAt: true,
        },
      });

      expect(result.chunkCount).toBe(2);
      expect(result.chunks).toEqual(chunks);
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
});
