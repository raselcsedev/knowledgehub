import { DocumentChunkingService } from './document-chunking.service';

describe('DocumentChunkingService', () => {
  let service: DocumentChunkingService;

  beforeEach(() => {
    service = new DocumentChunkingService();
  });

  describe('splitText', () => {
    it('should return an empty array for empty text', () => {
      expect(service.splitText('')).toEqual([]);
    });

    it('should return an empty array for whitespace-only text', () => {
      expect(service.splitText('   \n  ')).toEqual([]);
    });

    it('should return one chunk for short text', () => {
      const text = 'KnowledgeHub extracts document text.';

      const chunks = service.splitText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should split long text into multiple chunks', () => {
      const text = 'KnowledgeHub is a document assistant. '.repeat(100);

      const chunks = service.splitText(text);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
    });

    it('should preserve overlapping context between chunks', () => {
      const text = 'A'.repeat(3000);

      const chunks = service.splitText(text);

      expect(chunks.length).toBeGreaterThan(1);

      // The second chunk should begin with text
      // that also appeared at the end of the first chunk.
      expect(chunks[1].slice(0, 200)).toBe(
        chunks[0].slice(-200),
      );
    });

    it('should preserve all original content across chunks', () => {
      const text = 'KnowledgeHub document processing. '.repeat(100);

      const chunks = service.splitText(text);

      // Remove overlap before reconstructing the original text.
      const reconstructed =
        chunks[0] +
        chunks.slice(1).map((chunk) => chunk.slice(200)).join('');

      expect(reconstructed).toBe(text.trim());
    });
  });
});