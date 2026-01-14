import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  get<T>(apiRequest: string, options?: { params?: HttpParams }): Observable<T> {
    const url = this.apiUrl + apiRequest;
    return this.http.get<T>(url, options).pipe(catchError(this.handleError));
  }

  post<T>(apiRequest: string, item: unknown): Observable<T> {
    const url = this.apiUrl + apiRequest;
    return this.http.post<T>(url, item).pipe(catchError(this.handleError));
  }

  delete<T>(apiRequest: string): Observable<T> {
    const url = this.apiUrl + apiRequest;
    return this.http.delete<T>(url).pipe(catchError(this.handleError));
  }

  update<T>(apiRequest: string, item: T) {
    const url = this.apiUrl + apiRequest;
    return this.http
      .post<T>(url, item, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateWithPut<T>(apiRequest: string, item: T) {
    const url = this.apiUrl + apiRequest;
    return this.http
      .put<T>(url, item, httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('Client-side error:', error.error);
    } else {
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
    }
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}
