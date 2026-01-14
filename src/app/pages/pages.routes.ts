import { Routes } from '@angular/router';

export const PagesRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./profile/profile-edit/profile-edit.component').then(
        (m) => m.ProfileEditComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./products/products.component').then((m) => m.ProductsComponent),
  },
];
