
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../documents/embeddings.service';

describe('SearchService', () => {
  let service: SearchService;

  const prismaMock = {
    documentChunk: {
      findMany: jest.fn(),
    },
  };

  const embeddingsMock = {
    generateEmbedding: jest.fn(),
    getModelName: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmbeddingsService, useValue: embeddingsMock },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    embeddingsMock.generateEmbedding.mockResolvedValue([1, 0]);
    embeddingsMock.getModelName.mockReturnValue('mock-sha256-1536');
    prismaMock.documentChunk.findMany.mockResolvedValue([]);
  });

  describe('search', () => {
    it('should return an empty result when no embedded chunks exist', async () => {
      const result = await service.search('user-1', {
        query: 'renewable energy',
      });

      expect(result.totalMatches).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should rank chunks by cosine similarity', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Less similar content',
          chunkIndex: 0,
          embedding: [0, 1],
          embeddingModel: 'mock-sha256-1536',
          document: {
            id: 'doc-1',
            title: 'Document One',
            originalName: 'one.pdf',
          },
        },
        {
          id: 'chunk-2',
          content: 'Most similar content',
          chunkIndex: 1,
          embedding: [1, 0],
          embeddingModel: 'mock-sha256-1536',
          document: {
            id: 'doc-1',
            title: 'Document One',
            originalName: 'one.pdf',
          },
        },
      ]);

      const result = await service.search('user-1', {
        query: 'renewable energy',
        limit: 5,
      });

      expect(result.totalMatches).toBe(2);
      expect(result.results[0].chunkId).toBe('chunk-2');
      expect(result.results[0].similarity).toBe(1);
      expect(result.results[1].similarity).toBe(0);
    });

    it('should apply the requested result limit', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue(
        Array.from({ length: 3 }, (_, index) => ({
          id: `chunk-${index}`,
          content: `Content ${index}`,
          chunkIndex: index,
          embedding: [1, 0],
          embeddingModel: 'mock-sha256-1536',
          document: {
            id: 'doc-1',
            title: 'Document One',
            originalName: 'one.pdf',
          },
        })),
      );

      const result = await service.search('user-1', {
        query: 'test query',
        limit: 2,
      });

      expect(result.totalMatches).toBe(3);
      expect(result.results).toHaveLength(2);
    });

    it('should query only the authenticated user documents', async () => {
      await service.search('user-123', {
        query: 'test query',
      });

      expect(prismaMock.documentChunk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            document: {
              is: {
                userId: 'user-123',
                status: 'READY',
              },
            },
          }),
        }),
      );
    });
  });
});
