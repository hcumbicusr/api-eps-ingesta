import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RegistrarMedicionUseCase } from '../application/registrar-medicion.usecase';
import { RegistrarMedicionDto } from './dto/registrar-medicion.dto';

@Controller('api/v1/mediciones')
export class MedicionesController {
  private readonly logger = new Logger(MedicionesController.name);
  constructor(private readonly useCase: RegistrarMedicionUseCase) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() data: RegistrarMedicionDto, @Headers('x-sidi-simulacion-id') loteId?: string) {
    this.logger.log(
      `Post /api/v1/mediciones recibido: ${JSON.stringify(data)}`,
    );
    await this.useCase.execute(data, loteId);
    return {
      status: 'Aceptado',
      message: 'Lectura encolada para evaluación IA vía NestJS Hexagonal.',
    };
  }
}
