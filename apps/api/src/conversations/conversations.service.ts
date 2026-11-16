
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { QaService } from '../qa/qa.service';
import { AskQuestionDto } from '../qa/dto/ask-question.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qaService: QaService,
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title?.trim() || 'New conversation',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findOne(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async update(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: dto.title.trim() },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string, conversationId: string) {
    const result = await this.prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      message: 'Conversation deleted successfully',
    };
  }

  async createMessage(
    userId: string,
    conversationId: string,
    dto: AskQuestionDto,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const question = dto.question.trim();

    // Generate the answer using the existing QA service.
    const response = await this.qaService.askQuestion(userId, {
      ...dto,
      question,
    });

    // Save both messages after successful answer generation.
    const result = await this.prisma.$transaction(async (tx) => {
      const userMessage = await tx.message.create({
        data: {
          conversationId,
          role: 'USER',
          content: question,
        },
      });

      const assistantMessage = await tx.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: response.answer,
          citations: response.citations,
          provider: response.provider,
          model: response.model,
          embeddingModel: response.embeddingModel,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          title: question.slice(0, 60),
        },
      });

      return {
        userMessage,
        assistantMessage,
      };
    });

    return {
      ...result,
      qa: response,
    };
  }
}
