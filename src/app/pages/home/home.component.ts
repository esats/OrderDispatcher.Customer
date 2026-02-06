import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface StoreWithImages {
  id?: number | string;
  storeId?: number | string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  userName?: string;
  imageMasterId?: number;
  imageUrls?: string[];
}

interface BasketSummaryResponse {
  basketMasterId: number;
  storeId: string;
  deliveryAddressId: number;
  productCount: number;
}

interface BasketGetAllResponse {
  userId: string;
  baskets: BasketSummaryResponse[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  stores: StoreWithImages[] = [];
  basketCounts: Record<string, number> = {};

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.api.get<StoreWithImages[]>('/aggregate/engagement/stores-with-images').subscribe({
      next: (stores) => {
        this.stores = stores ?? [];
        this.loadBasketCounts();
      },
      error: () => {
        this.stores = [];
      },
    });
  }

  getStoreId(store: StoreWithImages): string | number | undefined {
    return store.storeId ?? store.id ?? store.userId;
  }

  placeOrder(store: StoreWithImages): void {
    const storeId = this.getStoreId(store);
    if (!storeId) {
      return;
    }
    this.router.navigate(['/products'], {
      queryParams: { storeId: String(storeId) },
    });
  }

  getBasketCount(store: StoreWithImages): number {
    const storeId = this.getStoreId(store);
    if (!storeId) {
      return 0;
    }
    return this.basketCounts[String(storeId)] ?? 0;
  }

  getStoreName(store: StoreWithImages): string {
    if (store.userName) {
      return store.userName;
    }

    const fullName = `${store.firstName ?? ''} ${store.lastName ?? ''}`.trim();
    return fullName || 'Store';
  }

  getInitials(store: StoreWithImages): string {
    const name = this.getStoreName(store);
    const parts = name.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? name.charAt(0);
    const second = parts[1]?.[0] ?? name.charAt(1);
    const initials = `${first}${second}`.trim() || name.slice(0, 2);
    return initials.toUpperCase();
  }

  private loadBasketCounts(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.basketCounts = {};
      return;
    }

    const params = new HttpParams().set('userId', userId);
    this.api.get<BasketGetAllResponse>('/order-management/basket/getAll', { params }).subscribe({
      next: (response) => {
        const nextCounts: Record<string, number> = {};
        const raw = response as BasketGetAllResponse & {
          UserId?: string;
          Baskets?: BasketSummaryResponse[];
        };
        const baskets = response?.baskets ?? raw?.Baskets ?? [];
        for (const basket of baskets) {
          const basketRaw = basket as BasketSummaryResponse & {
            StoreId?: string | number;
            ProductCount?: number;
          };
          const storeId = basket?.storeId ?? basketRaw?.StoreId;
          const productCount = basket?.productCount ?? basketRaw?.ProductCount ?? 0;
          if (storeId) {
            nextCounts[String(storeId)] = productCount;
          }
        }
        this.basketCounts = nextCounts;
      },
      error: () => {
        this.basketCounts = {};
      },
    });
  }
}
