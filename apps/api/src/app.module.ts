import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MusicModule } from './music/music.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { LibraryModule } from './library/library.module';
import { AiModule } from './ai/ai.module';
import { SocialModule } from './social/social.module';
import { PrismaService } from './prisma.service';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 second window
        limit: 10,   // 10 req/sec burst
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 minute window
        limit: 100,  // 100 req/min
      },
    ]),

    AuthModule,
    UsersModule,
    MusicModule,
    PlaylistsModule,
    LibraryModule,
    AiModule,
    SocialModule,
    AdminModule,
  ],
  providers: [
    PrismaService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
