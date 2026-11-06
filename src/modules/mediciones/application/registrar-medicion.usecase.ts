import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IMedicionRepository } from '../domain/medicion.repository';
import { RegistrarMedicionDto } from '../infrastructure/dto/registrar-medicion.dto';

@Injectable()
export class RegistrarMedicionUseCase {
  private readonly logger = new Logger(RegistrarMedicionUseCase.name);
  constructor(
    @Inject('IMedicionRepository')
    private readonly repository: IMedicionRepository,
  ) {}

  async execute(data: RegistrarMedicionDto, loteId?: string): Promise<void> {
    // Aquí iría lógica de validación de dominio
    if (data.consumo_m3 < 0) throw new Error('Consumo no puede ser negativo');
    this.logger.log(
      `RegistrarMedicionUseCase data enviada a repository rabbitmq: ${JSON.stringify(
        data,
      )}`,
    );
    const loteValido = loteId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loteId) ? loteId : null;
    const evento = {
      ...data,
      evento_id: randomUUID(),
      lote_id: loteValido,
      origen: loteValido ? 'simulador' : 'ingesta',
    };
    await this.repository.send(evento);
  }
}
