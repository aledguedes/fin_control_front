import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { mockApiInterceptor } from './src/services/mock-api.interceptor';

registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt' },
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.