import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ODataProductResponse } from '../models/product.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductCatalogService {
  private readonly serviceUrl = environment.odataV4.catalog;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const authHeader = this.authService.getAuthHeader();
    if (authHeader) {
      headers = headers.set('Authorization', authHeader);
    }

    return headers;
  }

  getProducts(): Observable<Product[]> {
    const url = `${environment.apiUrl}${this.serviceUrl}/Products?$filter=available eq true&$orderby=category,name`;
    return this.http.get<ODataProductResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.value)
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    const url = `${environment.apiUrl}${this.serviceUrl}/Products(${id})`;
    return this.http.get<Product>(url, {
      headers: this.getHeaders()
    });
  }

  getCategories(): Observable<string[]> {
    return this.getProducts().pipe(
      map(products => [...new Set(products.map(p => p.category))])
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.category === category))
    );
  }

  // Admin functions (nur für Approver)
  createProduct(product: Product): Observable<Product> {
    const url = `${environment.apiUrl}${this.serviceUrl}/Products`;
    return this.http.post<Product>(url, product, {
      headers: this.getHeaders()
    });
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    const url = `${environment.apiUrl}${this.serviceUrl}/Products(${id})`;
    return this.http.patch<Product>(url, product, {
      headers: this.getHeaders()
    });
  }

  deleteProduct(id: number): Observable<void> {
    const url = `${environment.apiUrl}${this.serviceUrl}/Products(${id})`;
    return this.http.delete<void>(url, {
      headers: this.getHeaders()
    });
  }
}
