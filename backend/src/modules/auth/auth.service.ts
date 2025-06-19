import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { username, isActive: true } 
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    console.log('🚀 AuthService.login вызван с данными:', loginDto);
    
    const user = await this.validateUser(loginDto.username, loginDto.password);
    console.log('🔍 Результат validateUser:', user ? 'Пользователь найден' : 'Пользователь НЕ найден');
    
    if (!user) {
      console.log('❌ Бросаем UnauthorizedException');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role 
    };

    const token = this.jwtService.sign(payload);
    console.log('✅ JWT токен создан успешно');

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    console.log('🚀 AuthService.register вызван с данными:', { 
      username: registerDto.username, 
      role: registerDto.role 
    });
    
    // Проверяем, существует ли пользователь с таким именем
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username }
    });

    if (existingUser) {
      console.log('❌ Пользователь уже существует');
      throw new ConflictException('User with this username already exists');
    }

    // Создаем нового пользователя
    const user = await this.createUser(
      registerDto.username, 
      registerDto.password, 
      registerDto.role || UserRole.USER
    );

    // Генерируем JWT токен для автоматического входа после регистрации
    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role 
    };

    const token = this.jwtService.sign(payload);
    console.log('✅ Пользователь зарегистрирован и токен создан успешно');

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      access_token: token,
    };
  }

  // Временный метод для создания правильного хэша
  async generatePasswordHash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async createUser(username: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    return this.userRepository.save(user);
  }

  async findUserById(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async ensureAdminExists(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'kasuf', role: UserRole.ADMIN },
    });

    if (!adminExists) {
      await this.createUser('kasuf', 'kasuf123', UserRole.ADMIN);
      console.log('Admin user created: kasuf / kasuf123');
    }
  }
}
