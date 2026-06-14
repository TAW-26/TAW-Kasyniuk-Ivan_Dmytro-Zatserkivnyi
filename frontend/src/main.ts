import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Zastosuj zapisany motyw przed startem aplikacji, aby przetrwał odświeżenie (F5)
// na każdej trasie i nie migotał jasnym motywem.
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

bootstrapApplication(AppComponent, appConfig);
