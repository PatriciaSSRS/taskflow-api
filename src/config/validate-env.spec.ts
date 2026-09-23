import { validateEnv } from './validate-env';

describe('validateEnv', () => {
  it('não valida nada fora de produção', () => {
    const config = { NODE_ENV: 'development' };
    expect(validateEnv(config)).toBe(config);
  });

  it('lança erro em produção se faltar uma variável obrigatória', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', DB_HOST: 'db' }),
    ).toThrow(/obrigatórias ausentes/);
  });

  it('lança erro em produção se um segredo ainda estiver com o valor padrão', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DB_HOST: 'db',
        DB_USER: 'taskflow',
        DB_PASSWORD: 'taskflow',
        DB_NAME: 'taskflow',
      }),
    ).toThrow(/valor padrão/);
  });

  it('passa em produção quando tudo está configurado corretamente', () => {
    const config = {
      NODE_ENV: 'production',
      DB_HOST: 'db',
      DB_USER: 'taskflow',
      DB_PASSWORD: 'uma-senha-forte',
      DB_NAME: 'taskflow',
      JWT_SECRET: 'um-segredo-forte',
    };
    expect(validateEnv(config)).toBe(config);
  });
});
