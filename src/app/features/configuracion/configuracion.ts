import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { SWAGGER_URL } from '../../core/api.config';
import { EstadoCarga } from '../../core/estado-carga';
import { getApiErrorMessage } from '../../core/api-error';
import { NotificacionService } from '../../core/notificacion.service';
import { ThemeService } from '../../core/theme.service';
import { PanelService } from '../panel/panel.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-configuracion',
  imports: [DatePipe],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class Configuracion {
  estadoApi: EstadoCarga = 'inicial';
  ultimaVerificacion: Date | null = null;
  errorApi = '';
  readonly nombreSistema = 'TitiShop';
  readonly versionSistema = '1.0.0';
  readonly swaggerUrl = SWAGGER_URL;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private panelService: PanelService,
    private notificacion: NotificacionService
  ) {
    this.verificarApi();
  }

  get usuarioActual() {
    return this.auth.session();
  }

  get temaActual(): string {
    return this.theme.isDark ? 'Oscuro' : 'Claro';
  }

  verificarApi(): void {
    this.estadoApi = 'cargando';
    this.errorApi = '';

    this.panelService.resumen().subscribe({
      next: () => {
        this.estadoApi = 'exito';
        this.ultimaVerificacion = new Date();
        this.notificacion.success('Conexión con backend verificada.');
      },
      error: (error: unknown) => {
        this.estadoApi = 'error';
        this.ultimaVerificacion = new Date();
        this.errorApi = getApiErrorMessage(error);
        this.notificacion.error(this.errorApi);
      },
    });
  }

  cambiarTema(): void {
    this.theme.toggle();
    this.notificacion.info(`Tema ${this.temaActual.toLowerCase()} activado.`);
  }
}
