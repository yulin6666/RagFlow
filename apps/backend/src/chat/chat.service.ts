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
    const { question, documentId } = queryDto;

    // Verify document exists and is ready
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    if (document.status !== 'ready') {
      throw new BadRequestException(
        `Document is not ready. Current status: ${document.status}`,
      );
    }

    try {
      // Call n8n RAG query workflow
      const response = await axios.post(
        `${this.n8nWebhookUrl}/rag-query`,
        {
          question,
          documentId,
        },
        {
          timeout: 30000, // 30 seconds timeout
        },
      );

      const { answer, sources } = response.data;

      // Save chat history
      const chatHistory = await this.prisma.chatHistory.create({
        data: {
          documentId,
          question,
          answer,
          sources: sources || [],
        },
      });

      return {
        id: chatHistory.id,
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

  async getChatHistory(documentId: string) {
    return this.prisma.chatHistory.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
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
