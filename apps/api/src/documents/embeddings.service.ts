
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly model = 'text-embedding-3-small';
  private readonly dimensions = 1536;

  constructor(private readonly configService: ConfigService) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.trim();

    if (!normalizedText) {
      throw new BadRequestException('Text cannot be empty');
    }

    const provider =
      this.configService.get<string>('EMBEDDINGS_PROVIDER') ?? 'openai';

    // Use deterministic mock embeddings during development.
    if (provider === 'mock') {
      return this.generateMockEmbedding(normalizedText);
    }

    if (provider !== 'openai') {
      throw new InternalServerErrorException(
        'Unsupported embedding provider',
      );
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OpenAI API key is not configured',
      );
    }

    try {
      const openai = new OpenAI({ apiKey });

      const response = await openai.embeddings.create({
        model: this.model,
        input: normalizedText,
        encoding_format: 'float',
      });

      const embedding = response.data[0]?.embedding;

      if (!embedding || embedding.length !== this.dimensions) {
        throw new Error('Unexpected embedding dimensions');
      }

      return embedding;
    } catch (error: unknown) {
      if (error instanceof OpenAI.APIError) {
        console.error('OpenAI API Error:', {
          status: error.status,
          code: error.code,
          message: error.message,
        });
      } else if (error instanceof Error) {
        console.error('Embedding Error:', error.message);
      }

      throw new InternalServerErrorException(
        'Failed to generate text embedding',
      );
    }
  }

  private generateMockEmbedding(text: string): number[] {
    const embedding: number[] = [];

    let counter = 0;

    while (embedding.length < this.dimensions) {
      const hash = createHash('sha256')
        .update(`${text}:${counter}`)
        .digest();

      for (let offset = 0; offset < hash.length; offset += 4) {
        const value = hash.readUInt32BE(offset);

        // Convert unsigned integer into a value between -1 and 1.
        embedding.push((value / 0xffffffff) * 2 - 1);

        if (embedding.length === this.dimensions) {
          break;
        }
      }

      counter++;
    }

    // Normalize the vector to unit length.
    const magnitude = Math.sqrt(
      embedding.reduce((sum, value) => sum + value * value, 0),
    );

    return embedding.map((value) => value / magnitude);
  }
}
