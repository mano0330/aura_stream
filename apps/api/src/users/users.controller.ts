import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('me/update')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: any,
    @Body() body: { bio?: string; avatarUrl?: string; username?: string; preferences?: string }
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('discover-listeners')
  @UseGuards(JwtAuthGuard)
  discoverListeners(@CurrentUser() user: any) {
    return this.usersService.discoverListeners(user.id);
  }

  @Get('profile/:username')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
