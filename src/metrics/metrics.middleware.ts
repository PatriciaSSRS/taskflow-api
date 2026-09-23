import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { httpRequestDuration, httpRequestsTotal } from './metrics.registry';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      // req.route só existe depois do roteamento do Express; usamos o
      // path base para não explodir a cardinalidade com valores de :id.
      const route = req.route?.path ?? req.path;
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

      httpRequestDuration.observe(labels, durationSeconds);
      httpRequestsTotal.inc(labels);
    });

    next();
  }
}
