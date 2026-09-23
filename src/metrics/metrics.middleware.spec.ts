import { MetricsMiddleware } from './metrics.middleware';
import { httpRequestsTotal } from './metrics.registry';

describe('MetricsMiddleware', () => {
  it('registra a requisição quando a resposta termina', () => {
    const middleware = new MetricsMiddleware();
    const incSpy = jest.spyOn(httpRequestsTotal, 'inc');

    const handlers: Record<string, () => void> = {};
    const req: any = {
      method: 'GET',
      path: '/tasks',
      route: { path: '/tasks' },
    };
    const res: any = {
      statusCode: 200,
      on: (event: string, cb: () => void) => {
        handlers[event] = cb;
      },
    };
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();

    handlers['finish']();

    expect(incSpy).toHaveBeenCalledWith({
      method: 'GET',
      route: '/tasks',
      status_code: '200',
    });
  });
});
