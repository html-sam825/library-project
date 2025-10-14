import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';

// ✅ Add these:
import { AuthModule } from './app/auth/auth.module';
import { SharedModule } from './app/shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideHttpClient(),
    ...appConfig.providers,
    importProvidersFrom(
      AuthModule,
      SharedModule,
      BrowserAnimationsModule
    )
  ]
}).catch((err) => console.error(err));
