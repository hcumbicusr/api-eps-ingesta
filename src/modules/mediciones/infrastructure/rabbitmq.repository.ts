import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IMedicionRepository } from '../domain/medicion.repository';

@Injectable()
export class RabbitMqRepository implements IMedicionRepository {
  private readonly logger = new Logger(RabbitMqRepository.name);
  constructor(
    @Inject('EPS_RABBIT_SERVICE') private readonly client: ClientProxy,
  ) {}

  async send(data: any): Promise<void> {
    // Emitimos un evento asíncrono (Pattern: medicion.registrada)
    this.logger.log(
      `RabbitMqRepository data enviada a rabbitmq: ${JSON.stringify(data)}`,
    );
    this.client.emit('medicion.registrada', data);
  }
}
