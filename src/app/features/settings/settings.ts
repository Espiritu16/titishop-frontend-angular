import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

interface AppConfig {
  nombreEmpresa: string;
  ruc: string;
  moneda: string;
  impuestoPorcentaje: number;
  umbralStockBajo: number;
  alertasActivas: boolean;
  modoOscuro: boolean;
}

const CONFIG_KEY = 'titishop_configuracion';

const DEFAULT_CONFIG: AppConfig = {
  nombreEmpresa: 'TitiShop Perú',
  ruc: '20601234567',
  moneda: 'PEN',
  impuestoPorcentaje: 18,
  umbralStockBajo: 10,
  alertasActivas: true,
  modoOscuro: false,
};

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  feedback = '';
  readonly configForm;

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.nonNullable.group({
      nombreEmpresa: [DEFAULT_CONFIG.nombreEmpresa, [Validators.required, Validators.minLength(3)]],
      ruc: [DEFAULT_CONFIG.ruc, [Validators.required, Validators.pattern(/^\d{11}$/)]],
      moneda: [DEFAULT_CONFIG.moneda, [Validators.required]],
      impuestoPorcentaje: [DEFAULT_CONFIG.impuestoPorcentaje, [Validators.required, Validators.min(0), Validators.max(100)]],
      umbralStockBajo: [DEFAULT_CONFIG.umbralStockBajo, [Validators.required, Validators.min(0)]],
      alertasActivas: [DEFAULT_CONFIG.alertasActivas, [Validators.required]],
      modoOscuro: [DEFAULT_CONFIG.modoOscuro, [Validators.required]],
    });
    this.loadConfig();
  }

  saveConfig(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.configForm.getRawValue()));
    this.feedback = 'Configuración guardada correctamente.';
  }

  resetToDefaults(): void {
    this.configForm.reset(DEFAULT_CONFIG);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    this.feedback = 'Configuración restablecida a valores iniciales.';
  }

  private loadConfig(): void {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<AppConfig>;
      this.configForm.patchValue({
        nombreEmpresa: parsed.nombreEmpresa ?? DEFAULT_CONFIG.nombreEmpresa,
        ruc: parsed.ruc ?? DEFAULT_CONFIG.ruc,
        moneda: parsed.moneda ?? DEFAULT_CONFIG.moneda,
        impuestoPorcentaje: parsed.impuestoPorcentaje ?? DEFAULT_CONFIG.impuestoPorcentaje,
        umbralStockBajo: parsed.umbralStockBajo ?? DEFAULT_CONFIG.umbralStockBajo,
        alertasActivas: parsed.alertasActivas ?? DEFAULT_CONFIG.alertasActivas,
        modoOscuro: parsed.modoOscuro ?? DEFAULT_CONFIG.modoOscuro,
      });
    } catch {
      localStorage.removeItem(CONFIG_KEY);
    }
  }
}
