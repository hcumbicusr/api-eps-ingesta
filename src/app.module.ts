import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MedicionesModule } from './modules/mediciones/infrastructure/mediciones.module';

@Module({
  imports: [MedicionesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
