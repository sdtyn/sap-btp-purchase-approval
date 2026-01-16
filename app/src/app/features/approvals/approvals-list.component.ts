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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PurchaseRequestService } from '../../core/services/purchase-request.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseRequest } from '../../core/models/purchase-request.model';

@Component({
  selector: 'app-approvals-list',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './approvals-list.component.html',
  styleUrls: ['./approvals-list.component.scss']
})
export class ApprovalsListComponent implements OnInit {
  requests = signal<PurchaseRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  displayedColumns = ['title', 'totalAmount', 'requester', 'createdAt', 'actions'];

  constructor(
    private purchaseRequestService: PurchaseRequestService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadApprovals();
  }

  loadApprovals(): void {
    this.loading.set(true);
    this.error.set(null);

    this.purchaseRequestService.getPendingApprovals().subscribe({
      next: (response) => {
        this.requests.set(response.value);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler beim Laden der Genehmigungen');
        this.loading.set(false);
      }
    });
  }

  approve(request: PurchaseRequest): void {
    if (!request.ID) return;

    if (confirm(`Möchten Sie die Bestellung "${request.title}" genehmigen?`)) {
      this.loading.set(true);
      this.purchaseRequestService.approvePurchaseRequest(request.ID).subscribe({
        next: () => {
          this.loadApprovals();
        },
        error: (err) => {
          const errorMessage = err.error?.error?.message || 'Fehler beim Genehmigen';
          alert(errorMessage);
          this.loading.set(false);
        }
      });
    }
  }

  reject(request: PurchaseRequest): void {
    if (!request.ID) return;

    if (confirm(`Möchten Sie die Bestellung "${request.title}" ablehnen?`)) {
      this.loading.set(true);
      this.purchaseRequestService.rejectPurchaseRequest(request.ID).subscribe({
        next: () => {
          this.loadApprovals();
        },
        error: (err) => {
          const errorMessage = err.error?.error?.message || 'Fehler beim Ablehnen';
          alert(errorMessage);
          this.loading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
