import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

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
