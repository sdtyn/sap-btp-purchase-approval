import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductCatalogService } from '../../core/services/product-catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductSelection } from '../../core/models/product.model';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss']
})
export class ProductCatalogComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  selectedProducts = signal<ProductSelection[]>([]);
  selectedCategory = signal<string>('Alle');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private catalogService: ProductCatalogService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalogService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        const cats = [...new Set(products.map(p => p.category))];
        this.categories.set(['Alle', ...cats]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler beim Laden des Katalogs');
        this.loading.set(false);
        console.error('Error loading products:', err);
      }
    });
  }

  getFilteredProducts(): Product[] {
    if (this.selectedCategory() === 'Alle') {
      return this.products();
    }
    return this.products().filter(p => p.category === this.selectedCategory());
  }

  selectProduct(product: Product): void {
    const selections = this.selectedProducts();
    const existing = selections.find(s => s.product.ID === product.ID);
    
    if (existing) {
      existing.quantity++;
    } else {
      selections.push({ product, quantity: 1 });
    }
    
    this.selectedProducts.set([...selections]);
  }

  removeProduct(productId?: number): void {
    if (!productId) return;
    const selections = this.selectedProducts().filter(s => s.product.ID !== productId);
    this.selectedProducts.set(selections);
  }

  getQuantity(productId?: number): number {
    if (!productId) return 0;
    const selection = this.selectedProducts().find(s => s.product.ID === productId);
    return selection ? selection.quantity : 0;
  }

  getTotalItems(): number {
    return this.selectedProducts().reduce((sum, s) => sum + s.quantity, 0);
  }

  getTotalAmount(): number {
    return this.selectedProducts().reduce((sum, s) => sum + (s.product.price * s.quantity), 0);
  }

  proceedToOrder(): void {
    if (this.selectedProducts().length === 0) {
      return;
    }
    
    // Save selections to session storage
    sessionStorage.setItem('selectedProducts', JSON.stringify(this.selectedProducts()));
    this.router.navigate(['/purchase-requests/create']);
  }

  goBack(): void {
    this.router.navigate(['/purchase-requests']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
