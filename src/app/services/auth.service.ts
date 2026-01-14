import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface LoginPayload {
  Email: string;
  Password: string;
}

interface LoginResponse {
  isSuccess: boolean;
  message?: string | null;
  value?: {
    bearerToken?: string | null;
    name?: string | null;
    userId?: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly tokenExpiryKey = 'auth_token_expires_at';
  private readonly userIdKey = 'auth_user_id';
  private readonly loginPath = '/auth/login';
  private readonly tokenLifetimeMs = 24 * 60 * 60 * 1000;

  constructor(private readonly api: ApiService) {}

  login(payload: LoginPayload): Observable<void> {
    return this.api.post<LoginResponse>(this.loginPath, payload).pipe(
      map((response) => {
        debugger
        const token = response?.value?.bearerToken;
        if (!response?.isSuccess || !token) {
          throw new Error(
            response?.message || 'Unable to login with the provided credentials.'
          );
        }
        this.storeToken(token);
        const userId = response?.value?.userId ?? null;
        if (userId) {
          localStorage.setItem(this.userIdKey, userId);
        } else {
          localStorage.removeItem(this.userIdKey);
        }
      })
    );
  }

  storeToken(token: string) {
    debugger
    localStorage.setItem(this.tokenKey, token);
    const expiresAt = Date.now() + this.tokenLifetimeMs;
    localStorage.setItem(this.tokenExpiryKey, String(expiresAt));
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    const expiresAt = Number(localStorage.getItem(this.tokenExpiryKey));

    if (!token || !expiresAt) {
      return null;
    }

    if (Date.now() >= expiresAt) {
      this.logout();
      return null;
    }

    return token;
  }

  getUserId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    localStorage.removeItem(this.userIdKey);
  }
}
