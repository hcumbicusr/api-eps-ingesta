import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    // 1. Salida estándar a consola (formato legible por humanos)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `[${timestamp}] ${level} [${context || 'Sistema'}]: ${message}`;
        }),
      ),
    }),

    // 2. Salida a archivo rotativo diario (logs/log_Ymd.log)
    new DailyRotateFile({
      dirname: 'logs', // Carpeta donde se guardarán (mapeada a tu volumen Docker)
      filename: 'log_api_eps_ingesta_%DATE%.log', // %DATE% será reemplazado por datePattern
      datePattern: 'YYYYMMDD', // Formato Ymd exacto
      zippedArchive: false, // Cambia a true si deseas comprimir logs antiguos
      maxSize: '20m', // Tamaño máximo por archivo antes de rotar
      maxFiles: '14d', // Retención de logs de las últimas 2 semanas para la EPS
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(), // JSON es ideal para luego ingerir en ElasticSearch o Datadog
      ),
    }),
  ],
});
