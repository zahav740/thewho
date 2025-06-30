import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

export class SearchUsernamesResponseDto {
  usernames: string[];
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    // ШАГ 1: Проверяем что тело запроса приходит
    console.log('🔍 ШАГ 1 - AuthController получил запрос с телом:', loginDto);
    console.log('🔍 Типы данных:', typeof loginDto.username, typeof loginDto.password);
    console.log('🔍 Длина строк:', loginDto.username?.length, loginDto.password?.length);
    
    try {
      const result = await this.authService.login(loginDto);
      console.log('✅ Успешный возврат из AuthService.login');
      return result;
    } catch (error) {
      console.log('❌ Ошибка в AuthController.login:', error.message);
      throw error;
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully', 
    type: RegisterResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this username already exists' 
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    console.log('🔍 AuthController получил запрос на регистрацию:', { 
      username: registerDto.username, 
      role: registerDto.role 
    });
    
    try {
      const result = await this.authService.register(registerDto);
      console.log('✅ Успешная регистрация пользователя');
      return result;
    } catch (error) {
      console.log('❌ Ошибка в AuthController.register:', error.message);
      throw error;
    }
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token is invalid' 
  })
  verifyToken(@Request() req) {
    return { 
      valid: true, 
      user: req.user 
    };
  }

  // Простой тестовый endpoint для проверки что auth controller работает
  @Get('test')
  @ApiOperation({ summary: 'Test auth controller' })
  testAuth() {
    console.log('🧪 Auth test endpoint вызван');
    return {
      message: 'Auth controller is working!',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /auth/login',
        'POST /auth/register', 
        'GET /auth/profile',
        'GET /auth/test'
      ]
    };
  }

  // Временный endpoint для генерации правильного хэша
  @Post('generate-hash')
  @ApiOperation({ summary: 'Generate password hash (temporary)' })
  async generateHash(@Body() body: { password: string }) {
    const hash = await this.authService.generatePasswordHash(body.password);
    return {
      password: body.password,
      hash: hash,
      message: 'Используйте этот хэш в базе данных'
    };
  }
}
