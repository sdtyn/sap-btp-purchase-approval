import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./approvals-list.component').then(m => m.ApprovalsListComponent)
  }
];
