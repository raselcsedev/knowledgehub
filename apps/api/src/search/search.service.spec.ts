
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

  const createChunk = (
    id: string,
    embedding: unknown,
  ) => ({
    id,
    content: `Content for ${id}`,
    chunkIndex: 0,
    embedding,
    embeddingModel: 'mock-sha256-1536',
    document: {
      id: 'doc-1',
      title: 'Document One',
      originalName: 'one.pdf',
    },
  });

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
        createChunk('chunk-1', [0, 1]),
        createChunk('chunk-2', [1, 0]),
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
        Array.from({ length: 3 }, (_, index) =>
          createChunk(`chunk-${index}`, [1, 0]),
        ),
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

    it.each([
      ['null embedding', null],
      ['string embedding', 'invalid-vector'],
      ['empty embedding', []],
    ])('should skip chunks with %s', async (_description, embedding) => {
      prismaMock.documentChunk.findMany.mockResolvedValue([
        createChunk('invalid-chunk', embedding),
      ]);

      const result = await service.search('user-1', {
        query: 'test query',
      });

      expect(result.totalMatches).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should skip chunks with mismatched vector dimensions', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue([
        createChunk('wrong-dimension', [1]),
      ]);

      const result = await service.search('user-1', {
        query: 'test query',
      });

      expect(result.totalMatches).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should skip chunks with zero-magnitude vectors', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue([
        createChunk('zero-vector', [0, 0]),
      ]);

      const result = await service.search('user-1', {
        query: 'test query',
      });

      expect(result.totalMatches).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should reject an empty search query', async () => {
      await expect(
        service.search('user-1', {
          query: '   ',
        }),
      ).rejects.toThrow('Search query cannot be empty');

      expect(embeddingsMock.generateEmbedding).not.toHaveBeenCalled();
      expect(prismaMock.documentChunk.findMany).not.toHaveBeenCalled();
    });
  });
});
