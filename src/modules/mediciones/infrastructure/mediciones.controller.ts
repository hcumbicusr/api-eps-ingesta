import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrarMedicionUseCase } from '../application/registrar-medicion.usecase';

@Controller('api/v1/mediciones')
export class MedicionesController {
  constructor(private readonly useCase: RegistrarMedicionUseCase) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() data: any) {
    await this.useCase.execute(data);
    return {
      status: 'Aceptado',
      message: 'Lectura encolada para evaluación IA vía NestJS Hexagonal.',
    };
  }
}
