import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { PanelResumenResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PanelService {
  constructor(private api: ApiClientService) {}

  resumen(): Observable<PanelResumenResponse> {
    return this.api.get<PanelResumenResponse>('/panel/resumen');
  }
}
