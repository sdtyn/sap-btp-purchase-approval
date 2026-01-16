import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { PurchaseRequestService } from '../../core/services/purchase-request.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseRequest } from '../../core/models/purchase-request.model';
import { ProductSelection } from '../../core/models/product.model';

@Component({
  selector: 'app-purchase-request-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatListModule
  ],
  templateUrl: './purchase-request-create.component.html',
  styleUrls: ['./purchase-request-create.component.scss']
})
export class PurchaseRequestCreateComponent implements OnInit {
  orderForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  selectedProducts = signal<ProductSelection[]>([]);

  constructor(
    private fb: FormBuilder,
    private purchaseRequestService: PurchaseRequestService,
    private authService: AuthService,
    private router: Router
  ) {
    this.orderForm = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit(): void {
    // Load selected products from session storage
    const stored = sessionStorage.getItem('selectedProducts');
    if (stored) {
      this.selectedProducts.set(JSON.parse(stored));
    }

    if (this.selectedProducts().length === 0) {
      // No products selected, redirect to catalog
      this.router.navigate(['/purchase-requests/catalog']);
    }
  }

  getTotalAmount(): number {
    return this.selectedProducts().reduce((sum, s) => sum + (s.product.price * s.quantity), 0);
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.selectedProducts().length === 0) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error.set('Benutzer nicht angemeldet');
      this.loading.set(false);
      return;
    }

    const formValue = this.orderForm.value;
    const items = this.selectedProducts().map(s => ({
      product_ID: s.product.ID!,
      quantity: s.quantity,
      price: s.product.price
    }));

    const request: PurchaseRequest = {
      title: `Bestellung - ${this.selectedProducts().map(s => s.product.name).join(', ')}`,
      description: `Lieferadresse: ${formValue.address}\n\nBemerkung: ${formValue.description || 'Keine'}`,
      totalAmount: this.getTotalAmount(),
      requester: currentUser.id,
      items: items
    };

    this.purchaseRequestService.createPurchaseRequest(request).subscribe({
      next: (draftResponse) => {
        // Draft created, now activate it
        if (draftResponse.ID) {
          this.purchaseRequestService.activateDraft(draftResponse.ID).subscribe({
            next: () => {
              sessionStorage.removeItem('selectedProducts');
              this.router.navigate(['/purchase-requests']);
            },
            error: (err) => {
              this.error.set(err.error?.error?.message || 'Fehler beim Aktivieren der Bestellung');
              this.loading.set(false);
            }
          });
        }
      },
      error: (err) => {
        this.error.set(err.error?.error?.message || 'Fehler beim Erstellen der Bestellung');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase-requests']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
