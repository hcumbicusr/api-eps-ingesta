import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarMedicionDto {
  @IsString()
  @IsNotEmpty()
  codigo_cliente: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_lectura: Date;

  @IsNumber()
  @IsIn([0, 1])
  @IsNotEmpty()
  lectura_estimada_flag: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  consumo_m3: number;
}
