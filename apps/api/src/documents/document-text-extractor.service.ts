import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { promises as fs } from 'fs';
import { extname } from 'path';

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

@Injectable()
export class DocumentTextExtractorService {
  async extractText(filePath: string): Promise<string> {
    const extension = extname(filePath).toLowerCase();

    try {
      const fileBuffer = await fs.readFile(filePath);

      let extractedText = '';

      if (extension === '.pdf') {
        extractedText = await this.extractPdfText(fileBuffer);
      } else if (extension === '.docx') {
        extractedText = await this.extractDocxText(fileBuffer);
      } else {
        throw new BadRequestException(
          'Unsupported document format',
        );
      }

      const cleanedText = extractedText.trim();

      if (!cleanedText) {
        throw new BadRequestException(
          'No readable text found in this document',
        );
      }

      return cleanedText;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Document text extraction failed:', error);

      throw new InternalServerErrorException(
        'Failed to extract document text',
      );
    }
  }

  private async extractPdfText(
    fileBuffer: Buffer,
  ): Promise<string> {
    const parser = new PDFParse({
      data: new Uint8Array(fileBuffer),
    });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private async extractDocxText(
    fileBuffer: Buffer,
  ): Promise<string> {
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return result.value;
  }
}