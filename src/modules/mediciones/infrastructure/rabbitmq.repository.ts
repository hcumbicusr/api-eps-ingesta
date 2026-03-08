import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IMedicionRepository } from '../domain/medicion.repository';

@Injectable()
export class RabbitMqRepository implements IMedicionRepository {
  constructor(
    @Inject('EPS_RABBIT_SERVICE') private readonly client: ClientProxy,
  ) {}

  async send(data: any): Promise<void> {
    // Emitimos un evento asíncrono (Pattern: medicion.registrada)
    this.client.emit('medicion.registrada', data);
  }
}
