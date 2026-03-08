// src/modules/mediciones/infrastructure/mediciones.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MedicionesController } from './mediciones.controller';
import { RegistrarMedicionUseCase } from '../application/registrar-medicion.usecase';
import { RabbitMqRepository } from './rabbitmq.repository';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EPS_RABBIT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:Admin123@localhost:5672'],
          queue: 'medicion.registrada',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [MedicionesController],
  providers: [
    RegistrarMedicionUseCase,
    {
      provide: 'IMedicionRepository',
      useClass: RabbitMqRepository,
    },
  ],
})
export class MedicionesModule {}
