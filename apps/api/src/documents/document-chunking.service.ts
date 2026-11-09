import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentChunkingService {
  private readonly chunkSize = 1200;
  private readonly chunkOverlap = 200;

  splitText(text: string): string[] {
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .trim();

    if (!normalizedText) {
      return [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalizedText.length) {
      let end = Math.min(
        start + this.chunkSize,
        normalizedText.length,
      );

      if (end < normalizedText.length) {
        const minimumBoundary = start + Math.floor(
          this.chunkSize * 0.5,
        );

        // Prefer paragraph boundaries.
        const paragraphBoundary = normalizedText.lastIndexOf(
          '\n\n',
          end,
        );

        if (paragraphBoundary >= minimumBoundary) {
          end = paragraphBoundary;
        } else {
          // Otherwise prefer a sentence or word boundary.
          const sentenceBoundary = normalizedText.lastIndexOf(
            '. ',
            end,
          );

          const wordBoundary = normalizedText.lastIndexOf(
            ' ',
            end,
          );

          if (sentenceBoundary >= minimumBoundary) {
            end = sentenceBoundary + 1;
          } else if (wordBoundary >= minimumBoundary) {
            end = wordBoundary;
          }
        }
      }

      const chunk = normalizedText
        .slice(start, end)
        .trim();

      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= normalizedText.length) {
        break;
      }

      // Move forward while retaining overlapping context.
      start = Math.max(end - this.chunkOverlap, start + 1);
    }

    return chunks;
  }
}