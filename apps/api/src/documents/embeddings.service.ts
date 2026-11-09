import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    } catch (error) {
      console.error('Embedding generation failed:', error);

      throw new InternalServerErrorException(
        'Failed to generate text embedding',
      );
    }
  }
}