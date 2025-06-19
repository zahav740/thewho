import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ 
    description: 'Username for the new user',
    example: 'newuser'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ 
    description: 'Password for the new user',
    example: 'password123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
