import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login.component';
import { UnauthorizedComponent } from './features/auth/unauthorized.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'purchase-requests',
    loadChildren: () => import('./features/purchase-requests/purchase-requests.routes').then(m => m.routes),
    canActivate: [authGuard, roleGuard('Requester')]
  },
  {
    path: 'approvals',
    loadChildren: () => import('./features/approvals/approvals.routes').then(m => m.routes),
    canActivate: [authGuard, roleGuard('Approver')]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
