import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Usado pelo TypeORM CLI (migration:generate / migration:run) fora do
// contexto do Nest. A app em runtime usa a mesma configuração via
// TypeOrmModule.forRoot em app.module.ts.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'taskflow',
  password: process.env.DB_PASSWORD ?? 'taskflow',
  database: process.env.DB_NAME ?? 'taskflow',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
