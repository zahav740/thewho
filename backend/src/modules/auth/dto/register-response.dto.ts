import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty({ description: 'Registration success message' })
  message: string;

  @ApiProperty({ description: 'Created user information' })
  user: {
    id: number;
    username: string;
    role: UserRole;
    createdAt: Date;
  };

  @ApiProperty({ description: 'JWT access token' })
  access_token: string;
}
