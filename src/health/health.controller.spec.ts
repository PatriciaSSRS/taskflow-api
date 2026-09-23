import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let health: jest.Mocked<HealthCheckService>;
  let db: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check: jest.fn() } },
        { provide: TypeOrmHealthIndicator, useValue: { pingCheck: jest.fn() } },
      ],
    }).compile();

    controller = module.get(HealthController);
    health = module.get(HealthCheckService);
    db = module.get(TypeOrmHealthIndicator);
  });

  it('live não depende de nenhum indicador externo', async () => {
    health.check.mockResolvedValue({ status: 'ok', info: {}, error: {}, details: {} });

    await controller.live();

    expect(health.check).toHaveBeenCalledWith([]);
  });

  it('ready verifica a conexão com o banco', async () => {
    health.check.mockImplementation(async (indicators) => {
      for (const indicator of indicators) {
        await indicator();
      }
      return { status: 'ok', info: {}, error: {}, details: {} };
    });
    db.pingCheck.mockResolvedValue({ database: { status: 'up' } });

    await controller.ready();

    expect(db.pingCheck).toHaveBeenCalledWith('database');
  });
});
