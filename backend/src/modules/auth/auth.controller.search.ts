import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export class SearchUsernamesResponseDto {
  usernames: string[];
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ... существующие методы ...

  @Get('search-usernames')
  @ApiOperation({ summary: 'Search usernames for autocomplete' })
  @ApiQuery({ 
    name: 'query', 
    required: true, 
    description: 'Search query (min 2 characters)',
    example: 'kas'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of matching usernames',
    type: SearchUsernamesResponseDto
  })
  async searchUsernames(@Query('query') query: string): Promise<SearchUsernamesResponseDto> {
    console.log('🔍 Поиск usernames по запросу:', query);
    
    if (!query || query.length < 2) {
      return { usernames: [] };
    }

    try {
      const usernames = await this.authService.searchUsernames(query);
      console.log('✅ Найдено usernames:', usernames.length);
      return { usernames };
    } catch (error) {
      console.log('❌ Ошибка поиска usernames:', error.message);
      return { usernames: [] };
    }
  }
}
