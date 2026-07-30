import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { CreateExtractionDto } from './dto/create-extraction.dto';
import axios from 'axios';
import * as XLSX from 'xlsx';

@Injectable()
export class ExtractionService {
  private readonly n8nWebhookBase: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.n8nWebhookBase = this.configService.get('N8N_WEBHOOK_BASE_URL');
  }

  async create(dto: CreateExtractionDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) throw new NotFoundException('Document not found');
    if (document.status !== 'ready') {
      throw new BadRequestException(`Document is not ready (status: ${document.status})`);
    }

    const job = await this.prisma.extractionJob.create({
      data: {
        documentId: dto.documentId,
        fields: dto.fields as never,
        status: 'processing',
      },
    });

    // Call n8n extraction workflow asynchronously
    this.runExtraction(job.id, dto.documentId, dto.fields).catch((err) => {
      console.error('Extraction workflow error:', err.message);
      this.prisma.extractionJob.update({
        where: { id: job.id },
        data: { status: 'failed' },
      });
    });

    return job;
  }

  private async runExtraction(
    jobId: string,
    documentId: string,
    fields: { key: string; label: string }[],
  ) {
    const response = await axios.post(
      `${this.n8nWebhookBase}/extract`,
      { jobId, documentId, fields },
      { timeout: 60000 },
    );

    const result = response.data?.result ?? {};

    await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: { status: 'completed', result },
    });
  }

  async findAll(documentId: string) {
    return this.prisma.extractionJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.extractionJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Extraction job not found');
    return job;
  }

  async approve(id: string) {
    return this.prisma.extractionJob.update({
      where: { id },
      data: { status: 'approved', reviewedAt: new Date() },
    });
  }

  async reject(id: string) {
    return this.prisma.extractionJob.update({
      where: { id },
      data: { status: 'rejected', reviewedAt: new Date() },
    });
  }

  async exportExcel(id: string): Promise<Buffer> {
    const job = await this.prisma.extractionJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Extraction job not found');
    if (job.status !== 'completed' && job.status !== 'approved') {
      throw new BadRequestException('Extraction is not completed yet');
    }

    const fields = job.fields as { key: string; label: string }[];
    const result = job.result as Record<string, string>;

    // Build rows: one row per field (label + value)
    const rows = fields.map(f => ({
      Field: f.label,
      Value: result?.[f.key] ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Fields');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
