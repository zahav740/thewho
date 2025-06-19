import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

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
