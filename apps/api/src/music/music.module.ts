import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MusicController],
  providers: [MusicService, PrismaService],
  exports: [MusicService],
})
export class MusicModule {}
