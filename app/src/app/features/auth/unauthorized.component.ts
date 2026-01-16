import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Zugriff verweigert</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>
          <button mat-raised-button color="primary" (click)="goHome()">
            Zur Startseite
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    mat-card {
      max-width: 500px;
    }

    button {
      margin-top: 16px;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
