import { Controller, Get, Post, Body, Param, Put, Logger } from '@nestjs/common';
import { KablanService } from './kablan.service';

@Controller('kablan')
export class KablanController {
  private readonly logger = new Logger(KablanController.name);

  constructor(private readonly kablanService: KablanService) {}

  @Get('status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }

  @Get('boards')
  async getAllBoards() {
    this.logger.log('GET /kablan/boards');
    return this.kablanService.getBoards();
  }

  @Get('boards/:id')
  async getBoardById(@Param('id') id: string) {
    this.logger.log(`GET /kablan/boards/${id}`);
    return this.kablanService.getBoardById(id);
  }
}
