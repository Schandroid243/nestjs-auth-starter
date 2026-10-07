import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password } = registerDto;

    //Hachage du mot de passe avec un coût (salt rounds) de 12
    const passwordHash = await bcrypt.hash(password, 12);

    return this.usersService.create({
      email,
      passwordHash,
    });
  }
}
