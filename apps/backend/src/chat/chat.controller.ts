import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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

  @Get('sessions')
  async getSessions() {
    return this.chatService.getSessions();
  }

  @Get('sessions/:sessionId')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionMessages(sessionId);
  }

  @Get('history/global')
  async getGlobalHistory() {
    return this.chatService.getGlobalHistory();
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
