import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:username')
  follow(@CurrentUser() user: any, @Param('username') username: string) {
    return this.socialService.followUser(user.id, username);
  }

  @Get('followers')
  getFollowers(@CurrentUser() user: any) {
    return this.socialService.getFollowers(user.id);
  }

  @Get('following')
  getFollowing(@CurrentUser() user: any) {
    return this.socialService.getFollowing(user.id);
  }

  @Post('comments')
  addComment(
    @CurrentUser() user: any,
    @Body() body: { songId: string; content: string },
  ) {
    return this.socialService.addComment(user.id, body.songId, body.content);
  }

  @Get('comments/:songId')
  getComments(@Param('songId') songId: string) {
    return this.socialService.getComments(songId);
  }

  @Delete('comments/:commentId')
  deleteComment(@CurrentUser() user: any, @Param('commentId') commentId: string) {
    return this.socialService.deleteComment(commentId, user.id);
  }

  @Get('feed')
  getActivityFeed(@CurrentUser() user: any) {
    return this.socialService.getActivityFeed(user.id);
  }
}
