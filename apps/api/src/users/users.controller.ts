import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.usersService.register(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('count')
  count() {
    return this.usersService.count();
  }
}