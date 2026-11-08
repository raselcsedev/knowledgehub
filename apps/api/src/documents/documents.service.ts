import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Documents retrieved successfully',
      documents,
    };
  }

  async countByUser(userId: string) {
    return this.prisma.document.count({
      where: {
        userId,
      },
    });
  }

  async findOneByUser(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      message: 'Document retrieved successfully',
      document,
    };
  }

  async remove(documentId: string, userId: string) {
    const result = await this.prisma.document.deleteMany({
      where: {
        id: documentId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Document not found');
    }

    return {
      message: 'Document deleted successfully',
    };
  }
}
