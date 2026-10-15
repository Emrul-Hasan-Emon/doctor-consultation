import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './orm-config';

/** TypeORM CLI entry. See migration:* scripts in package.json. */
export default new DataSource(
  buildDataSourceOptions({ get: (key) => process.env[key] }),
);
