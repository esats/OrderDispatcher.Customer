import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  id?: number;
  name?: string;
  productId?: number;
  productName?: string;
  description?: string;
  productPrice: number;
  imageUrl?: string | null;
  quantity: number;
  unitType?: number;
  weight?: number;
}

interface BasketDetailResponse {
  userId: string;
  storeId: string;
  basketMasterId: number;
  deliveryAddressId: number;
  items: BasketItem[];
}

interface BasketSaveRequest {
  UserId: string;
  StoreId: string;
  DeliveryAddressId: number;
  ProductId: number;
  Quantity: number;
  ProductPrice: number;
  UnitType: number;
  Weight: number;
}

interface BasketSaveResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: {
    basketMasterId?: number;
    basketDetailId?: number;
  } | null;
}

interface PlaceOrderRequest {
  CustomerId: string;
  StoreId: string;
  BasketMasterId: number;
  ShopperId?: string | null;
  Subtotal?: number | null;
  Tip?: number | null;
  Total?: number | null;
}

interface PlaceOrderResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: unknown;
}

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgFor,
    NgIf,
    FormsModule,
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
  deliveryAddressId = 0;
  basketMasterId = 0;
  showTipModal = false;
  tip: number | null = null;
  orderSuccess = false;
  isPlacingOrder = false;

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
    return this.basketItems.reduce((total, item) => total + item.productPrice * item.quantity, 0);
  }

  get total(): number {
    return this.subtotal;
  }

  increase(item: BasketItem): void {
    this.updateQuantity(item, 1);
  }

  decrease(item: BasketItem): void {
    this.updateQuantity(item, -1);
  }

  remove(item: BasketItem): void {
    this.setQuantity(item, 0);
  }

  openTipModal(): void {
    if (!this.basketItems.length) {
      return;
    }

    this.tip = null;
    this.showTipModal = true;
  }

  closeTipModal(): void {
    if (this.isPlacingOrder) {
      return;
    }
    this.showTipModal = false;
  }

  confirmPlaceOrder(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No user id found. Please log in again.');
      return;
    }

    if (!this.storeId) {
      console.error('No store id found. Please select a store again.');
      return;
    }

    if (!this.basketMasterId) {
      console.error('No basket master id found. Please reload your basket.');
      return;
    }

    this.isPlacingOrder = true;
    const payload: PlaceOrderRequest = {
      CustomerId: userId,
      StoreId: this.storeId,
      Tip:this.tip,
      BasketMasterId: this.basketMasterId,
      ShopperId: null,
      Subtotal: this.subtotal,
      Total: this.total,
    };

    this.api.post<PlaceOrderResponse>('/order-management/order/save', payload).subscribe({
      next: (response) => {
        this.isPlacingOrder = false;
        if (response?.isSuccess === false) {
          console.error(response?.message || 'Unable to place order.');
          return;
        }
        this.showTipModal = false;
        this.orderSuccess = true;
      },
      error: (err) => {
        this.isPlacingOrder = false;
        console.error(err?.message || 'Unable to place order.');
      },
    });
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
          if (response?.storeId && !this.storeId) {
            this.storeId = response.storeId;
          }
          if (response?.deliveryAddressId) {
            this.deliveryAddressId = response.deliveryAddressId;
          }
          if (response?.basketMasterId) {
            this.basketMasterId = response.basketMasterId;
          }
          this.basketItems = items.map((item) => ({
            id: item.id ?? item.productId ?? 0,
            productId: item.productId ?? item.id ?? 0,
            name: item.name ?? item.productName ?? '',
            description: item.description ?? '',
            productPrice: item.productPrice,
            imageUrl: item.imageUrl ?? null,
            quantity: item.quantity ?? 0,
            unitType: item.unitType,
            weight: item.weight,
          }));
        },
        error: (err) => {
          console.error(err?.message || 'Unable to load basket details.');
          this.basketItems = [];
        },
      });
  }

  private updateQuantity(item: BasketItem, delta: number): void {
    const current = item.quantity ?? 0;
    const nextQuantity = Math.max(0, current + delta);
    if (nextQuantity === current) {
      return;
    }

    this.saveQuantity(item, nextQuantity);
  }

  private setQuantity(item: BasketItem, quantity: number): void {
    const nextQuantity = Math.max(0, quantity);
    if ((item.quantity ?? 0) === nextQuantity) {
      return;
    }

    this.saveQuantity(item, nextQuantity);
  }

  private saveQuantity(item: BasketItem, nextQuantity: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No user id found. Please log in again.');
      return;
    }

    const productId = item.productId ?? item.id ?? 0;
    if (!productId) {
      console.error('No product id found for basket item.');
      return;
    }

    if (!this.storeId) {
      console.error('No store id found. Please select a store again.');
      return;
    }

    const payload: BasketSaveRequest = {
      UserId: userId,
      StoreId: this.storeId,
      DeliveryAddressId: this.deliveryAddressId,
      ProductId: productId,
      Quantity: nextQuantity,
      ProductPrice: item.productPrice ?? 0,
      UnitType: item.unitType ?? 0,
      Weight: item.weight ?? 0,
    };

    this.api.post<BasketSaveResponse>('/order-management/basket/save', payload).subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          console.error(response?.message || 'Unable to save basket item.');
          return;
        }

        item.quantity = nextQuantity;
        if (nextQuantity === 0) {
          this.basketItems = this.basketItems.filter(
            (entry) => (entry.productId ?? entry.id) !== productId
          );
        }
      },
      error: (err) => {
        console.error(err?.message || 'Unable to save basket item.');
      },
    });
  }
}
