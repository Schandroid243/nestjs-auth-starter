import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';

// Load environment variables from .env file
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, //To force the usage of migrations instead of auto-syncing
});
