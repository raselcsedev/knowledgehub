
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';

import { QaService } from './qa.service';
import { SearchService } from '../search/search.service';
import { OPENAI_CLIENT } from './qa.constants';

describe('QaService', () => {
  let service: QaService;

  const searchMock = {
    search: jest.fn(),
  };

  const configMock = {
    get: jest.fn(),
  };

  const openaiMock = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  const mockSearchResults = {
    embeddingModel: 'mock-sha256-1536',
    totalMatches: 1,
    results: [
      {
        chunkId: 'chunk-1',
        content: 'IELTS Writing Task 2 practice material.',
        chunkIndex: 0,
        similarity: 0.85,
        document: {
          id: 'doc-1',
          title: 'IELTS Writing',
          originalName: 'ielts.pdf',
        },
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaService,
        { provide: SearchService, useValue: searchMock },
        { provide: ConfigService, useValue: configMock },
        {
          provide: OPENAI_CLIENT,
          useValue: openaiMock as unknown as OpenAI,
        },
      ],
    }).compile();

    service = module.get<QaService>(QaService);

    searchMock.search.mockResolvedValue(mockSearchResults);

    configMock.get.mockImplementation((key: string) => {
      if (key === 'QA_PROVIDER') return 'mock';
      if (key === 'QA_MODEL') return 'gpt-4o-mini';
      return undefined;
    });

    openaiMock.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'IELTS Task 2 requires a clear position. [Source 1]',
          },
        },
      ],
    });
  });

  describe('mock provider', () => {
    it('should return a mock answer with citations', async () => {
      const result = await service.askQuestion('user-1', {
        question: 'IELTS writing task 2 essay',
        limit: 5,
      });

      expect(result.provider).toBe('mock');
      expect(result.question).toBe('IELTS writing task 2 essay');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0]).toEqual(
        expect.objectContaining({
          sourceNumber: 1,
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          documentTitle: 'IELTS Writing',
        }),
      );

      expect(openaiMock.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should return no citations when no matching chunks exist', async () => {
      searchMock.search.mockResolvedValue({
        embeddingModel: 'mock-sha256-1536',
        totalMatches: 0,
        results: [],
      });

      const result = await service.askQuestion('user-1', {
        question: 'Unknown topic',
      });

      expect(result.provider).toBe('none');
      expect(result.citations).toEqual([]);
      expect(result.answer).toContain('No indexed document content');
    });
  });

  describe('question validation and retrieval', () => {
    it('should trim whitespace from the question', async () => {
      const result = await service.askQuestion('user-1', {
        question: '  IELTS writing task 2 essay  ',
      });

      expect(result.question).toBe('IELTS writing task 2 essay');

      expect(searchMock.search).toHaveBeenCalledWith('user-1', {
        query: 'IELTS writing task 2 essay',
        limit: 5,
      });
    });

    it('should pass the requested limit to SearchService', async () => {
      await service.askQuestion('user-1', {
        question: 'IELTS writing',
        limit: 3,
      });

      expect(searchMock.search).toHaveBeenCalledWith('user-1', {
        query: 'IELTS writing',
        limit: 3,
      });
    });

    it('should reject an empty question', async () => {
      await expect(
        service.askQuestion('user-1', {
          question: '   ',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(searchMock.search).not.toHaveBeenCalled();
    });

    it('should wrap search failures as internal server errors', async () => {
      searchMock.search.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.askQuestion('user-1', {
          question: 'IELTS writing',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('OpenAI provider', () => {
    beforeEach(() => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'QA_PROVIDER') return 'openai';
        if (key === 'QA_MODEL') return 'gpt-4o-mini';
        return undefined;
      });
    });

    it('should generate an answer using retrieved document context', async () => {
      const result = await service.askQuestion('user-1', {
        question: 'What is IELTS Writing Task 2?',
        limit: 5,
      });

      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.embeddingModel).toBe('mock-sha256-1536');
      expect(result.answer).toContain('[Source 1]');
      expect(result.citations).toHaveLength(1);

      expect(openaiMock.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Do not invent facts'),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(
                'IELTS Writing Task 2 practice material.',
              ),
            }),
          ]),
        }),
      );
    });

    it('should use the configured model', async () => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'QA_PROVIDER') return 'openai';
        if (key === 'QA_MODEL') return 'custom-test-model';
        return undefined;
      });

      const result = await service.askQuestion('user-1', {
        question: 'IELTS writing',
      });

      expect(result.model).toBe('custom-test-model');

      expect(openaiMock.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'custom-test-model',
        }),
      );
    });

    it('should reject an empty OpenAI response', async () => {
      openaiMock.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      await expect(
        service.askQuestion('user-1', {
          question: 'IELTS writing',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle OpenAI API failures', async () => {
      openaiMock.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API unavailable'),
      );

      await expect(
        service.askQuestion('user-1', {
          question: 'IELTS writing',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should fail when the OpenAI client is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          QaService,
          { provide: SearchService, useValue: searchMock },
          { provide: ConfigService, useValue: configMock },
          {
            provide: OPENAI_CLIENT,
            useValue: null,
          },
        ],
      }).compile();

      const serviceWithoutOpenAI = module.get<QaService>(QaService);

      await expect(
        serviceWithoutOpenAI.askQuestion('user-1', {
          question: 'IELTS writing',
        }),
      ).rejects.toThrow('OpenAI is not configured');
    });
  });

  it('should reject an unsupported QA provider', async () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === 'QA_PROVIDER') return 'unsupported';
      return undefined;
    });

    await expect(
      service.askQuestion('user-1', {
        question: 'IELTS writing',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
