import { Controller, Post, Get, Patch, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExtractionService } from './extraction.service';
import { CreateExtractionDto } from './dto/create-extraction.dto';

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post()
  create(@Body() dto: CreateExtractionDto) {
    return this.extractionService.create(dto);
  }

  @Get('document/:documentId')
  findAll(@Param('documentId') documentId: string) {
    return this.extractionService.findAll(documentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extractionService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.extractionService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.extractionService.reject(id);
  }

  @Get(':id/export')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.extractionService.exportExcel(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="extraction-${id}.xlsx"`);
    res.send(buffer);
  }
}
