import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./purchase-requests-list.component').then(m => m.PurchaseRequestsListComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./product-catalog.component').then(m => m.ProductCatalogComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./purchase-request-create.component').then(m => m.PurchaseRequestCreateComponent)
  }
];
