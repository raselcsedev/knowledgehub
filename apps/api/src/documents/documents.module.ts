import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentChunkingService } from './document-chunking.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentTextExtractorService,
    DocumentChunkingService,
  ],
})
export class DocumentsModule {}