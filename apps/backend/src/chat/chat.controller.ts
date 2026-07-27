import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { QueryDto } from './dto/query.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  async query(@Body() queryDto: QueryDto) {
    return this.chatService.query(queryDto);
  }

  @Get('history/:documentId')
  async getChatHistory(@Param('documentId') documentId: string) {
    return this.chatService.getChatHistory(documentId);
  }

  @Get('history/:documentId/latest')
  async getLatestChat(@Param('documentId') documentId: string) {
    return this.chatService.getLatestChat(documentId);
  }
}
