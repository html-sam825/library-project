import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { config } from 'rxjs';
import { JwtModule } from '@auth0/angular-jwt';

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
          allowedDomains: ['localhost:5131'],
        }
      })
     ),
     provideHttpClient(withInterceptorsFromDi()),
    ],
};
