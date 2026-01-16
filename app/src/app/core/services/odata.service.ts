import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ODataService {
  constructor(
    protected http: HttpClient,
    protected authService: AuthService
  ) {}

  protected getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const authHeader = this.authService.getAuthHeader();
    if (authHeader) {
      headers = headers.set('Authorization', authHeader);
    }

    return headers;
  }

  protected get<T>(serviceUrl: string, entity: string, params?: HttpParams): Observable<T> {
    const url = `${environment.apiUrl}${serviceUrl}/${entity}`;
    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params
    });
  }

  protected getById<T>(serviceUrl: string, entity: string, id: string, expand?: string): Observable<T> {
    let params = new HttpParams();
    if (expand) {
      params = params.set('$expand', expand);
    }
    
    const url = `${environment.apiUrl}${serviceUrl}/${entity}(${id})`;
    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params
    });
  }

  protected post<T>(serviceUrl: string, entity: string, data: any): Observable<T> {
    const url = `${environment.apiUrl}${serviceUrl}/${entity}`;
    return this.http.post<T>(url, data, {
      headers: this.getHeaders()
    });
  }

  protected patch<T>(serviceUrl: string, entity: string, id: string, data: any): Observable<T> {
    const url = `${environment.apiUrl}${serviceUrl}/${entity}(${id})`;
    return this.http.patch<T>(url, data, {
      headers: this.getHeaders()
    });
  }

  protected delete(serviceUrl: string, entity: string, id: string): Observable<void> {
    const url = `${environment.apiUrl}${serviceUrl}/${entity}(${id})`;
    return this.http.delete<void>(url, {
      headers: this.getHeaders()
    });
  }

  protected action<T>(serviceUrl: string, entity: string, id: string, action: string, data?: any): Observable<T> {
    const url = `${environment.apiUrl}${serviceUrl}/${entity}(${id})/${action}`;
    return this.http.post<T>(url, data || {}, {
      headers: this.getHeaders()
    });
  }
}
