import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { ALL_ENTITIES } from './entities/all-entities';

type Env = { get(key: string): string | undefined };

/** Shared by the Nest runtime and the TypeORM CLI. */
export function buildDataSourceOptions(env: Env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.get('DB_HOST') ?? 'localhost',
    port: Number(env.get('DB_PORT') ?? 5432),
    username: env.get('DB_USERNAME') ?? 'postgres',
    password: env.get('DB_PASSWORD') || undefined,
    database: env.get('DB_NAME') ?? 'doctor_consultation',
    ssl: env.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
    entities: ALL_ENTITIES,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    // Never auto-sync. Schema changes go through migrations only.
    synchronize: false,
    logging: env.get('DB_LOGGING') === 'true',
  };
}

export const ormConfig = (config: ConfigService): TypeOrmModuleOptions =>
  buildDataSourceOptions(config);
