import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PurchaseRequestService } from '../../core/services/purchase-request.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseRequest } from '../../core/models/purchase-request.model';

@Component({
  selector: 'app-purchase-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './purchase-requests-list.component.html',
  styleUrls: ['./purchase-requests-list.component.scss']
})
export class PurchaseRequestsListComponent implements OnInit {
  requests = signal<PurchaseRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  displayedColumns = ['title', 'totalAmount', 'status', 'createdAt', 'requester'];

  constructor(
    private purchaseRequestService: PurchaseRequestService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.purchaseRequestService.getPurchaseRequests().subscribe({
      next: (response) => {
        this.requests.set(response.value);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler beim Laden der Bestellungen');
        this.loading.set(false);
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'New': 'accent',
      'Pending': 'warn',
      'Approved': 'primary',
      'Rejected': ''
    };
    return colors[status] || '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  createNew(): void {
    this.router.navigate(['/purchase-requests/catalog']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
