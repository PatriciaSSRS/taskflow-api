import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

// pino-pretty é devDependency (não existe na imagem de produção, que
// só instala deps de runtime). Resolve em runtime em vez de confiar
// só em NODE_ENV, para nunca derrubar o boot se alguém rodar a imagem
// de produção fora de NODE_ENV=production.
function resolvePrettyTransport() {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }
  try {
    require.resolve('pino-pretty');
    return { target: 'pino-pretty', options: { singleLine: true } };
  } catch {
    return undefined;
  }
}

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        // Correlaciona todas as linhas de log de uma requisição pelo
        // x-request-id recebido (ou um novo, se o cliente não mandar um).
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id = typeof existing === 'string' ? existing : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        level: process.env.LOG_LEVEL ?? 'info',
        transport: resolvePrettyTransport(),
        autoLogging: { ignore: (req) => req.url === '/metrics' },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
