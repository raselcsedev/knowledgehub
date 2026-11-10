import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingsService } from './embeddings.service';

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let configService: { get: jest.Mock };
  let createMock: jest.Mock;

  const mockEmbedding = Array(1536).fill(0.25);

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string) =>
        key === 'EMBEDDINGS_PROVIDER' ? 'openai' : 'test-api-key',
      ),
    };

    createMock = jest.fn().mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      embeddings: {
        create: createMock,
      },
    }));

    service = new EmbeddingsService(configService as unknown as ConfigService);
  });

  it('should generate a 1536-dimensional embedding', async () => {
    const result = await service.generateEmbedding(
      'KnowledgeHub is an AI document assistant.',
    );

    expect(result).toHaveLength(1536);
    expect(createMock).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'KnowledgeHub is an AI document assistant.',
      encoding_format: 'float',
    });
  });

  it('should reject empty text', async () => {
    await expect(service.generateEmbedding('   ')).rejects.toThrow(
      BadRequestException,
    );

    expect(createMock).not.toHaveBeenCalled();
  });

  it('should reject when API key is missing', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'EMBEDDINGS_PROVIDER' ? 'openai' : undefined,
    );

    await expect(service.generateEmbedding('Test document')).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(createMock).not.toHaveBeenCalled();
  });

  it('should handle OpenAI API errors', async () => {
    createMock.mockRejectedValue(new Error('OpenAI API error'));

    await expect(service.generateEmbedding('Test document')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should reject unexpected embedding dimensions', async () => {
    createMock.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2] }],
    });

    await expect(service.generateEmbedding('Test document')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
it('should generate mock embeddings without calling OpenAI', async () => {
  configService.get.mockImplementation((key: string) =>
    key === 'EMBEDDINGS_PROVIDER' ? 'mock' : undefined,
  );

  const result = await service.generateEmbedding('KnowledgeHub document');

  expect(result).toHaveLength(1536);
  expect(result.every(Number.isFinite)).toBe(true);

  expect(createMock).not.toHaveBeenCalled();
});

it('should return the correct mock model name', () => {
  configService.get.mockImplementation((key: string) =>
    key === 'EMBEDDINGS_PROVIDER' ? 'mock' : undefined,
  );

  expect(service.getModelName()).toBe('mock-sha256-1536');
});

});
