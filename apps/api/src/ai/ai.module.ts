import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiClientService } from './ai-client.service';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [MusicModule],
  controllers: [AiController],
  providers: [AiService, AiClientService],
  exports: [AiService],
})
export class AiModule {}
