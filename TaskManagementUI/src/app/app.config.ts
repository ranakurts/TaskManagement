import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Bileşenler subscribe/setTimeout içinde alan güncelliyor; zone.js olmadan bu değişiklikler
    // ekrana yansımıyordu (ör. davet kabul edilince bildirimin kaybolmaması).
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
