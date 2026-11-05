import {
  Controller, Get, Headers, HttpCode, HttpStatus, Param, Post,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { SimuladorMedicionesService } from '../application/simulador-mediciones.service';

@Controller('api/v1/mediciones/simulaciones')
export class SimuladorMedicionesController {
  constructor(private readonly simulador: SimuladorMedicionesService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  iniciar(@Headers('x-sidi-simulator-token') token?: string) {
    this.autorizar(token);
    return this.simulador.iniciar();
  }

  @Get(':id')
  consultar(@Param('id') id: string, @Headers('x-sidi-simulator-token') token?: string) {
    this.autorizar(token);
    return this.simulador.consultar(id);
  }

  private autorizar(token?: string): void {
    if (process.env.SIMULATOR_ENABLED !== 'true') {
      throw new ServiceUnavailableException('Simulador deshabilitado. Solo desarrollo.');
    }
    const esperado = process.env.SIMULATOR_TOKEN || '';
    if (!esperado || !token) throw new UnauthorizedException('Token de simulación requerido.');
    const a = Buffer.from(token), b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Token de simulación inválido.');
    }
  }
}
