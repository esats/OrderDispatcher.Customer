import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface BasketItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
}

interface BasketDetailItem {
  productId: number;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  unitType: number;
  weight: number;
}

interface BasketDetailResponse {
  userId: string;
  storeId: string;
  basketMasterId: number;
  deliveryAddressId: number;
  items: BasketDetailItem[];
}

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgFor,
    NgIf,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './basket.component.html',
  styleUrl: './basket.component.css',
})
export class BasketComponent implements OnInit {
  basketItems: BasketItem[] = [];
  storeId = '';
  deliveryWindow = 'Today, 3:00 PM - 5:00 PM';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.storeId = params.get('storeId') ?? '';
      this.loadBasketDetail();
    });
  }

  get subtotal(): number {
    return this.basketItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get total(): number {
    return this.subtotal;
  }

  increase(item: BasketItem): void {
    item.quantity += 1;
  }

  decrease(item: BasketItem): void {
    item.quantity = Math.max(0, item.quantity - 1);
    if (item.quantity === 0) {
      this.basketItems = this.basketItems.filter((entry) => entry.id !== item.id);
    }
  }

  remove(item: BasketItem): void {
    this.basketItems = this.basketItems.filter((entry) => entry.id !== item.id);
  }

  private loadBasketDetail(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No user id found. Please log in again.');
      this.basketItems = [];
      return;
    }

    let params = new HttpParams().set('userId', userId);
    if (this.storeId) {
      params = params.set('storeId', this.storeId);
    }

    this.api
      .get<BasketDetailResponse>('/aggregate/order-management/basketDetail', {
        params,
      })
      .subscribe({
        next: (response) => {
          const items = response?.items ?? [];
          this.basketItems = items.map((item) => ({
            id: item.productId,
            name: item.productName ?? '',
            description: '',
            price: 0,
            imageUrl: item.imageUrl ?? null,
            quantity: item.quantity ?? 0,
          }));
        },
        error: (err) => {
          console.error(err?.message || 'Unable to load basket details.');
          this.basketItems = [];
        },
      });
  }
}
