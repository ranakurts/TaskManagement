import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Token'ı uygulamanın başından değil, isteğin atıldığı AN okuyoruz (Eski token takılı kalmaz)
  const token = localStorage.getItem('sys_session_token');

  // Tarayıcının API'den gelen eski kullanıcı verilerini (304 Not Modified) getirmesini engelliyoruz
  let headers = req.headers
    .set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('Expires', '0');

  // Token varsa ekle
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const authReq = req.clone({ headers });
  return next(authReq);
};