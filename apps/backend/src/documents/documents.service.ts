import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly uploadDir: string;
  private readonly n8nWebhookUrl: string;
  private readonly backendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.n8nWebhookUrl = this.configService.get('N8N_WEBHOOK_BASE_URL');
    this.backendUrl = this.configService.get('BACKEND_URL') || 'http://host.docker.internal:3001';

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadDocument(file: Express.Multer.File) {
    try {
      // Ensure uploads directory exists
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      // Save file to disk
      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join(this.uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      const fileUrl = `/uploads/${filename}`;

      // Create database record
      const document = await this.prisma.document.create({
        data: {
          filename: file.originalname,
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'pending',
        },
      });

      // Trigger n8n workflow for processing
      try {
        // Mark as processing before triggering n8n
        await this.prisma.document.update({
          where: { id: document.id },
          data: { status: 'processing' },
        });

        await axios.post(`${this.n8nWebhookUrl}/process-pdf`, {
          documentId: document.id,
          fileUrl: `${this.backendUrl}${fileUrl}`,
          filename: file.originalname,
        });
      } catch (error) {
        console.error('Failed to trigger n8n workflow:', error.message);
        await this.prisma.document.update({
          where: { id: document.id },
          data: { status: 'failed' },
        });
      }

      return document;
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async getAllDocuments() {
    return this.prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: { chatHistory: true },
        },
      },
    });
  }

  async getDocumentById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        chatHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    // Delete file from disk
    const filepath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database (cascade will delete chat history)
    await this.prisma.document.delete({
      where: { id },
    });

    // TODO: Delete from Pinecone vector database

    return { message: 'Document deleted successfully' };
  }

  async getDocumentStatus(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        status: true,
        chunkCount: true,
        processedAt: true,
      },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    return document;
  }

  async updateDocumentStatus(
    id: string,
    status: string,
    chunkCount?: number,
  ) {
    return this.prisma.document.update({
      where: { id },
      data: {
        status,
        chunkCount: chunkCount || undefined,
        processedAt: status === 'ready' ? new Date() : undefined,
      },
    });
  }
}
