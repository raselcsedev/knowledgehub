import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentChunkingService } from './document-chunking.service';
import { EmbeddingsService } from './embeddings.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentTextExtractorService,
    DocumentChunkingService,
    EmbeddingsService,
  ],
  exports: [EmbeddingsService],
})
export class DocumentsModule {}
