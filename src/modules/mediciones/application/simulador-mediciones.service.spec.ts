import { ConflictException } from '@nestjs/common';
import { generarMedicionSimulada, SimuladorMedicionesService } from './simulador-mediciones.service';
import { SimuladorMedicionesController } from '../infrastructure/simulador-mediciones.controller';

const entorno = { ...process.env };

describe('Simulador HTTP SIDI', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    process.env.SIMULATOR_ENABLED = 'true';
    process.env.SIMULATOR_TOKEN = 'dev-token';
    process.env.INGESTA_PORT = '5000';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    process.env = { ...entorno };
  });

  it('genera 100 DTO con clientes sintéticos y consumo no negativo', () => {
    const datos = Array.from({ length: 100 }, (_, i) => generarMedicionSimulada(i));
    expect(datos[0].codigo_cliente).toBe('C00000');
    expect(datos[99].codigo_cliente).toBe('C00099');
    expect(datos.every((d) => d.consumo_m3 >= 0 && [0, 1].includes(d.lectura_estimada_flag))).toBe(true);
    expect(() => generarMedicionSimulada(100)).toThrow(RangeError);
  });

  it('envía 100 solicitudes HTTP POST con separación de un segundo', async () => {
    const enviar = jest.spyOn(global, 'fetch').mockResolvedValue({ status: 202 } as Response);
    const service = new SimuladorMedicionesService();
    const inicio = service.iniciar();
    expect(() => service.iniciar()).toThrow(ConflictException);
    expect(inicio.total).toBe(100);
    expect(inicio.intervalo_ms).toBe(1000);
    await jest.advanceTimersByTimeAsync(1000);
    expect(enviar).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(99000);
    expect(enviar).toHaveBeenCalledTimes(100);
    const fin = service.consultar(inicio.id);
    expect(fin.estado).toBe('COMPLETADO');
    expect(fin.intentadas).toBe(100);
    expect(fin.aceptadas_http).toBe(100);
    expect(fin.fallidas_http).toBe(0);
    expect(enviar.mock.calls[0][0]).toBe('http://127.0.0.1:5000/api/v1/mediciones');
  });

  it('continúa si una solicitud falla y lo registra', async () => {
    let contador = 0;
    jest.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ status: ++contador === 3 ? 503 : 202 } as Response));
    const service = new SimuladorMedicionesService();
    const inicio = service.iniciar();
    await jest.advanceTimersByTimeAsync(100000);
    const fin = service.consultar(inicio.id);
    expect(fin.estado).toBe('COMPLETADO_CON_ERRORES');
    expect(fin.aceptadas_http).toBe(99);
    expect(fin.fallidas_http).toBe(1);
  });

  it('requiere token y habilitación explícita', () => {
    const ctrl = new SimuladorMedicionesController(new SimuladorMedicionesService());
    expect(() => ctrl.iniciar('otro-token')).toThrow();
    delete process.env.SIMULATOR_ENABLED;
    expect(() => ctrl.iniciar('dev-token')).toThrow();
  });
});
