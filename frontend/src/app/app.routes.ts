import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'ads/:id',
    loadComponent: () => import('./pages/ad-detail/ad-detail.component').then((m) => m.AdDetailComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'ads',
        loadComponent: () => import('./pages/ads/ads.component').then((m) => m.AdsComponent),
        data: { title: 'Ogłoszenia lokalne' },
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.component').then((m) => m.FavoritesComponent),
        data: { title: 'Ulubione ogłoszenia' },
      },
      {
        path: 'add-ad',
        loadComponent: () => import('./pages/add-ad/add-ad.component').then((m) => m.AddAdComponent),
        data: { title: 'Dodaj ogłoszenie' },
      },
      {
        path: 'ads/:id/edit',
        loadComponent: () => import('./pages/add-ad/add-ad.component').then((m) => m.AddAdComponent),
        data: { title: 'Edytuj ogłoszenie' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
        data: { title: 'Mój profil' },
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
        data: { title: 'Ustawienia' },
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages/messages.component').then((m) => m.MessagesComponent),
        data: { title: 'Wiadomości' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
