import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { QueryDto } from './dto/query.dto';
import axios from 'axios';

@Injectable()
export class ChatService {
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.n8nWebhookUrl = this.configService.get('N8N_WEBHOOK_BASE_URL');
  }

  async query(queryDto: QueryDto) {
    const { question, documentId, sessionId } = queryDto;

    if (documentId) {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });
      if (!document) throw new BadRequestException('Document not found');
      if (document.status !== 'ready') {
        throw new BadRequestException(`Document is not ready. Current status: ${document.status}`);
      }
    }

    try {
      const response = await axios.post(
        `${this.n8nWebhookUrl}/rag-query`,
        { question, documentId: documentId || null },
        { timeout: 120000 },
      );

      const { answer, sources } = response.data;

      // Resolve or create session
      let resolvedSessionId = sessionId;
      if (!resolvedSessionId) {
        const session = await this.prisma.chatSession.create({
          data: { title: question.slice(0, 40) },
        });
        resolvedSessionId = session.id;
      }

      const chatHistory = await this.prisma.chatHistory.create({
        data: {
          documentId: documentId || null,
          sessionId: resolvedSessionId,
          question,
          answer,
          sources: sources || [],
        },
      });

      return {
        id: chatHistory.id,
        sessionId: resolvedSessionId,
        question,
        answer,
        sources,
        createdAt: chatHistory.createdAt,
      };
    } catch (error) {
      console.error('RAG query failed:', error.message);
      throw new BadRequestException(
        `Query failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  async getSessions() {
    const sessions = await this.prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: { select: { messages: true } },
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      messageCount: s._count.messages,
    }));
  }

  async getSessionMessages(sessionId: string) {
    return this.prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getChatHistory(documentId: string) {
    return this.prisma.chatHistory.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  async getGlobalHistory() {
    return this.prisma.chatHistory.findMany({
      where: { documentId: null },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  async getLatestChat(documentId: string) {
    return this.prisma.chatHistory.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
