import { Injectable, Inject, Logger } from '@nestjs/common';
import { IMedicionRepository } from '../domain/medicion.repository';
import { RegistrarMedicionDto } from '../infrastructure/dto/registrar-medicion.dto';

@Injectable()
export class RegistrarMedicionUseCase {
  private readonly logger = new Logger(RegistrarMedicionUseCase.name);
  constructor(
    @Inject('IMedicionRepository')
    private readonly repository: IMedicionRepository,
  ) {}

  async execute(data: RegistrarMedicionDto): Promise<void> {
    // Aquí iría lógica de validación de dominio
    if (data.consumo_m3 < 0) throw new Error('Consumo no puede ser negativo');
    this.logger.log(
      `RegistrarMedicionUseCase data enviada a repository rabbitmq: ${JSON.stringify(
        data,
      )}`,
    );
    await this.repository.send(data);
  }
}
