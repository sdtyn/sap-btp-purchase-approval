import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, LoginRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_credentials';
  private currentUser = signal<User | null>(null);
  
  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  login(credentials: LoginRequest): Observable<User> {
    // Encode credentials for Basic Auth
    const encodedCredentials = btoa(`${credentials.username}:${credentials.password}`);
    
    // Test the credentials by calling the purchase request service
    return this.http.get<any>(`${environment.apiUrl}${environment.odataV4.purchaseRequest}`, {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`
      }
    }).pipe(
      map(() => {
        // If successful, determine roles based on username
        const roles: string[] = [];
        if (credentials.username === 'katja') {
          roles.push('Requester');
        } else if (credentials.username === 'markus') {
          roles.push('Requester', 'Approver');
        }

        const user: User = {
          id: credentials.username,
          roles: roles
        };

        // Store credentials and user info
        this.storeAuth(encodedCredentials, user);
        this.currentUser.set(user);
        
        return user;
      }),
      catchError(error => {
        return throwError(() => new Error('Login failed. Please check your credentials.'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.roles.includes(role) ?? false;
  }

  getAuthHeader(): string | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const { credentials } = JSON.parse(stored);
      return `Basic ${credentials}`;
    }
    return null;
  }

  private storeAuth(credentials: string, user: User): void {
    const authData = {
      credentials,
      user
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }

  private loadStoredAuth(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const { user } = JSON.parse(stored);
        this.currentUser.set(user);
      } catch (error) {
        this.logout();
      }
    }
  }
}
