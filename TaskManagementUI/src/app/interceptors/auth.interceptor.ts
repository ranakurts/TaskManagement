import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { API_BASE_URL } from '../api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Token isteğin atıldığı anda okunur (eski token takılı kalmaz)
  const token = auth.getToken();
  const isApiCall = req.url.startsWith(API_BASE_URL);

  const authReq = token && isApiCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Süresi dolmuş / geçersiz oturum: giriş ekranına yönlendir
      if (err.status === 401 && isApiCall && !req.url.includes('/auth/')) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
