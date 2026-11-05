import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface EstadoSimulacion {
  id: string;
  estado: 'EN_EJECUCION' | 'COMPLETADO' | 'COMPLETADO_CON_ERRORES';
  total: number;
  intervalo_ms: number;
  intentadas: number;
  aceptadas_http: number;
  fallidas_http: number;
  inicio: string;
  fin: string | null;
  ultimo_error: string | null;
  nota: string;
}

/** IDs sintéticos compatibles con el generador SIDI-DATA-002. */
export function generarMedicionSimulada(i: number) {
  if (!Number.isInteger(i) || i < 0 || i >= 100) {
    throw new RangeError('Índice fuera del lote de 100');
  }
  const normal = 12 + ((i * 37) % 330) / 10;
  const consumo = i % 13 === 0 ? 0 : i % 17 === 0 ? 92 + i % 18 : normal;
  return {
    codigo_cliente: 'C' + String(i).padStart(5, '0'),
    fecha_lectura: new Date().toISOString(),
    consumo_m3: Number(consumo.toFixed(2)),
    lectura_estimada_flag: i % 9 === 0 ? 1 : 0,
  };
}

@Injectable()
export class SimuladorMedicionesService {
  private readonly logger = new Logger(SimuladorMedicionesService.name);
  private readonly trabajos = new Map<string, EstadoSimulacion>();
  private activo: string | null = null;
  private readonly total = 100;
  private readonly intervaloMs = 1000;

  iniciar(): EstadoSimulacion {
    if (this.activo) throw new ConflictException('Simulación activa: ' + this.activo);
    const id = randomUUID();
    const trabajo: EstadoSimulacion = {
      id, estado: 'EN_EJECUCION', total: this.total,
      intervalo_ms: this.intervaloMs, intentadas: 0, aceptadas_http: 0,
      fallidas_http: 0, inicio: new Date().toISOString(), fin: null,
      ultimo_error: null,
      nota: 'Aceptación HTTP no equivale a inferencia procesada por RabbitMQ o IA.',
    };
    this.trabajos.set(id, trabajo);
    this.activo = id;
    while (this.trabajos.size > 10) {
      const anterior = this.trabajos.keys().next().value as string | undefined;
      if (!anterior || anterior === id) break;
      this.trabajos.delete(anterior);
    }
    void this.ejecutar(trabajo).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      trabajo.ultimo_error = message.slice(0, 200);
      trabajo.estado = 'COMPLETADO_CON_ERRORES';
      trabajo.fin = new Date().toISOString();
      this.logger.error(message);
    }).finally(() => {
      if (this.activo === id) this.activo = null;
    });
    return { ...trabajo };
  }

  consultar(id: string): EstadoSimulacion {
    const trabajo = this.trabajos.get(id);
    if (!trabajo) throw new NotFoundException('Simulación no encontrada o proceso reiniciado.');
    return { ...trabajo };
  }

  private async ejecutar(trabajo: EstadoSimulacion): Promise<void> {
    const puerto = Number(process.env.INGESTA_PORT || process.env.PORT || '5000');
    const url = 'http://127.0.0.1:' + puerto + '/api/v1/mediciones';
    this.logger.log('Inicio lote ' + trabajo.id + ': 100 POST, intervalo >= 1000 ms');
    for (let i = 0; i < this.total; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generarMedicionSimulada(i)),
          signal: AbortSignal.timeout(8000),
        });
        if (response.status !== 202) {
          throw new Error('HTTP ' + response.status + ' en solicitud ' + (i + 1));
        }
        trabajo.aceptadas_http++;
      } catch (err: unknown) {
        trabajo.fallidas_http++;
        const motivo = err instanceof Error ? err.message : String(err);
        trabajo.ultimo_error = motivo.slice(0, 200);
        this.logger.warn('Lote ' + trabajo.id + ' solicitud ' + (i + 1) + ': ' + motivo);
      }
      trabajo.intentadas = i + 1;
      if (i < this.total - 1) {
        // Una petición cada >= 1 segundo, sin superponer peticiones.
        await new Promise<void>((resolve) => setTimeout(resolve, this.intervaloMs));
      }
    }
    trabajo.estado = trabajo.fallidas_http === 0 ? 'COMPLETADO' : 'COMPLETADO_CON_ERRORES';
    trabajo.fin = new Date().toISOString();
    this.logger.log('Fin lote ' + trabajo.id + ' aceptadas=' + trabajo.aceptadas_http +
      ' fallidas=' + trabajo.fallidas_http);
  }
}
