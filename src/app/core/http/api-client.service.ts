import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import { apiUrl } from '../api.config';
import { PaginacionQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: PaginacionQuery): Observable<T> {
    return this.http.get<T>(apiUrl(path), {
      params: this.buildParams(params),
    });
  }

  getBlob(path: string, params?: PaginacionQuery): Observable<Blob> {
    return this.http.get(apiUrl(path), {
      params: this.buildParams(params),
      responseType: 'blob',
    }).pipe(catchError((error: unknown) => this.normalizarErrorBlob(error)));
  }

  post<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(apiUrl(path), body);
  }

  postForm<TResponse>(path: string, body: FormData): Observable<TResponse> {
    return this.http.post<TResponse>(apiUrl(path), body);
  }

  put<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(apiUrl(path), body);
  }

  patch<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.patch<TResponse>(apiUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(apiUrl(path));
  }

  private buildParams(params?: PaginacionQuery): Record<string, string> | undefined {
    if (!params) return undefined;

    return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value === null || value === undefined || value === '') return acc;
      acc[key] = String(value);
      return acc;
    }, {});
  }

  private normalizarErrorBlob(error: unknown): Observable<never> {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
      return throwError(() => error);
    }

    const blob = error.error;
    if (!blob.type.includes('application/json')) {
      return throwError(() => error);
    }

    return from(blob.text()).pipe(
      mergeMap((text) => {
        try {
          const parsed = JSON.parse(text) as unknown;
          return throwError(
            () =>
              new HttpErrorResponse({
                error: parsed,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url ?? undefined,
              })
          );
        } catch {
          return throwError(() => error);
        }
      })
    );
  }
}
