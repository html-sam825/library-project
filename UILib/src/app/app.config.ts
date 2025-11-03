import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { config } from 'rxjs';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers:[
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes),
     provideAnimations(),
     provideHttpClient(),
     importProvidersFrom(
      JwtModule.forRoot({
        config:{  
          tokenGetter: ()=> {
            return localStorage.getItem('access_token');
          },
          
        }
      })
     ),
     provideHttpClient(withInterceptorsFromDi()),
      {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    ],
};
