import {
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

const RETRIED = new HttpContextToken<boolean>(() => false);

function withAuth(auth: AuthService, req: HttpRequest<unknown>, context?: HttpContext): HttpRequest<unknown> {
  const token = auth.getToken();
  return req.clone({
    withCredentials: true,
    ...(context ? { context } : {}),
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh');

  const alreadyRetried = req.context.get(RETRIED);

  return next(withAuth(auth, req)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint && !alreadyRetried) {
        const retriedContext = new HttpContext().set(RETRIED, true);

        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return auth.refresh().pipe(
            switchMap((accessToken) => {
              isRefreshing = false;
              refreshSubject.next(accessToken);
              return next(withAuth(auth, req, retriedContext));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              auth.logoutLocal();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            }),
          );
        }

        return refreshSubject.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap(() => next(withAuth(auth, req, retriedContext))),
        );
      }

      return throwError(() => err);
    }),
  );
};
