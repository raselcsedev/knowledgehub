
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchDto } from './dto/search.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async search(
    @Request() req: { user: { userId?: string; sub?: string } },
    @Body() dto: SearchDto,
  ) {
    const userId = req.user.userId ?? req.user.sub;

    return this.searchService.search(userId!, dto);
  }
}
