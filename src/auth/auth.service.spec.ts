import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// 1. MOCK DE SÉCURITÉ : On empêche Jest de lire le vrai UsersService et ses imports TypeORM
jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  // 2. Déclaration des fonctions espionnes réutilisables
  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'super-secret-key';
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService, // Injection de notre mock propre
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    it('Devrait inscrire un utilisateur avec succès', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const fakeHashedPassword = 'hashed_password_xyz';
      const fakeCreateUser = {
        id: 'uuid-123',
        email: registerDto.email,
        passwordHash: fakeHashedPassword,
        role: UserRole.USER,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(fakeHashedPassword);
      mockUsersService.create.mockResolvedValue(fakeCreateUser);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: fakeHashedPassword,
      });
      expect(result).toEqual(fakeCreateUser);
    });

    it("Devrait rejeter l'inscription si l'email était déjà utilisé", async () => {
      const registerDto = { email: 'test@admin', password: 'password123' };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Cet email est déjà utilisé.'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login()', () => {
    it('Devrait rejeter si le mot de passe est incorrect', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'mauvais_password',
      };
      const fakeUserInDb = {
        id: 'uuid-123',
        email: 'user@example.com',
        passwordHash: 'vrai_hash_dans_la_db',
        role: UserRole.USER,
      };

      mockUsersService.findByEmail.mockResolvedValue(fakeUserInDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
