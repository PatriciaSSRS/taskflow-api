import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';

@Module({
  controllers: [MetricsController],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicado em todas as rotas menos /metrics, para o scrape do
    // Prometheus não virar uma métrica sobre si mesmo.
    consumer.apply(MetricsMiddleware).exclude('metrics').forRoutes('*');
  }
}
