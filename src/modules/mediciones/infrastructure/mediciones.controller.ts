import {
  Controller,
  Post,
  Body,
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
  async create(@Body() data: RegistrarMedicionDto) {
    this.logger.log(
      `Post /api/v1/mediciones recibido: ${JSON.stringify(data)}`,
    );
    await this.useCase.execute(data);
    return {
      status: 'Aceptado',
      message: 'Lectura encolada para evaluación IA vía NestJS Hexagonal.',
    };
  }
}
