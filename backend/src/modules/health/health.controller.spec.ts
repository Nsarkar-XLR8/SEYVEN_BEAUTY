import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation((indicators: Array<() => HealthIndicatorResult>) => {
              const results = indicators.map((fn) => fn());
              return { status: 'ok', info: Object.assign({}, ...results) };
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return liveness status', async () => {
    const result = await controller.checkLiveness();
    expect(result.status).toBe('ok');
    expect((result as unknown as { info: { process: { status: string } } }).info.process.status).toBe('up');
  });

  it('should return readiness status', async () => {
    const result = await controller.checkReadiness();
    expect(result.status).toBe('ok');
    expect((result as unknown as { info: { system: { status: string } } }).info.system.status).toBe('up');
  });
});
