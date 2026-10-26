import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password } = registerDto;

    //Hachage du mot de passe avec un coût (salt rounds) de 12
    const passwordHash = await bcrypt.hash(password, 12);

    return this.usersService.create({
      email,
      passwordHash,
    });
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);
    const invalidCredentialsError = new UnauthorizedException(
      'Email ou mot de passe invalide.',
    );

    if (!user) {
      throw invalidCredentialsError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw invalidCredentialsError;
    }

    const payload: { sub: string; role: UserRole } = {
      sub: user.id,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    } as JwtSignOptions);

    const refreshTokenPlain = crypto.randomBytes(64).toString('base64url');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenPlain)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const familiyId = crypto.randomUUID();

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      familiyId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      expiresAt,
    };
  }
}
