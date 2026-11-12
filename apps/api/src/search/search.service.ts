
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../documents/embeddings.service';
import { SearchDto } from './dto/search.dto';

export interface SearchResult {
  chunkId: string;
  content: string;
  chunkIndex: number;
  document: {
    id: string;
    title: string;
    originalName: string;
  };
  embeddingModel: string;
  similarity: number;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async search(userId: string, dto: SearchDto) {
    const query = dto.query.trim();

    if (!query) {
      throw new BadRequestException('Search query cannot be empty');
    }

    // 1. Generate an embedding for the search query.
    const queryEmbedding =
      await this.embeddingsService.generateEmbedding(query);

    const modelName = this.embeddingsService.getModelName();

    // 2. Retrieve only this user's chunks with compatible embeddings.
    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        document: {
          is: {
            userId,
            status: 'READY',
          },
        },
        embeddingModel: modelName,
        embeddedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        content: true,
        chunkIndex: true,
        embedding: true,
        embeddingModel: true,
        document: {
          select: {
            id: true,
            title: true,
            originalName: true,
          },
        },
      },
    });

    // 3. Calculate similarity for every valid stored embedding.
    const results: SearchResult[] = [];

    for (const chunk of chunks) {
      if (!this.isNumberArray(chunk.embedding)) {
        continue;
      }

      const similarity = this.cosineSimilarity(
        queryEmbedding,
        chunk.embedding,
      );

      if (similarity === null) {
        continue;
      }

      results.push({
        chunkId: chunk.id,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        document: chunk.document,
        embeddingModel: chunk.embeddingModel!,
        similarity: Number(similarity.toFixed(6)),
      });
    }

    // 4. Rank results from highest to lowest similarity.
    results.sort((a, b) => b.similarity - a.similarity);

    // 5. Return the requested number of results.
    const limit = dto.limit ?? 5;

    return {
      query,
      embeddingModel: modelName,
      totalMatches: results.length,
      results: results.slice(0, limit),
    };
  }

  private isNumberArray(value: unknown): value is number[] {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (item) => typeof item === 'number' && Number.isFinite(item),
      )
    );
  }

  private cosineSimilarity(
    vectorA: number[],
    vectorB: number[],
  ): number | null {
    if (vectorA.length !== vectorB.length) {
      return null;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] ** 2;
      magnitudeB += vectorB[i] ** 2;
    }

    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

    if (denominator === 0) {
      return null;
    }

    return dotProduct / denominator;
  }
}
