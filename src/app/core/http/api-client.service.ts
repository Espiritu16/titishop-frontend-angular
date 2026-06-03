import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api.config';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(apiUrl(path));
  }

  post<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(apiUrl(path), body);
  }

  put<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(apiUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(apiUrl(path));
  }
}
