import { NgFor, NgIf } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  brandId: number;
  categoryId: number;
  imageMasterId: number;
  order: number;
  imageUrls: string[];
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

interface BasketDetail {
  basketMasterId: number;
  productId: number;
  quantity: number;
  unitType: number;
  weight: number;
}

interface BasketGetOneResponse {
  userId: string;
  storeId: string;
  basketMasterId: number;
  deliveryAddressId: number;
  items: BasketDetail[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  products: CatalogProduct[] = [];
  storeId = '';
  quantities: Record<number, number> = {};
  deliveryAddressId = 0;
  private readonly basketPreviewKey = 'basket_preview';

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const storeId = params.get('storeId') ?? '';
      this.storeId = storeId;
      if (!storeId) {
        this.products = [];
        this.quantities = {};
        return;
      }

      const httpParams = new HttpParams().set('storeId', storeId);
      this.api
        .get<CatalogProduct[]>('/aggregate/catalog/products-with-images', { params: httpParams })
        .subscribe({
          next: (products) => {
            this.products =
              products?.map((product, index) => {
                const raw = product as {
                  Id?: number | string;
                  ProductId?: number | string;
                };
                const resolvedId =
                  product.id ?? raw.ProductId ?? raw.Id ?? index;
                const numericId =
                  typeof resolvedId === 'number' ? resolvedId : Number(resolvedId);
                const id = Number.isFinite(numericId) ? numericId : index;

                return {
                  ...product,
                  id,
                  imageUrls:
                    product.imageUrls ??
                    (product as { ImageUrls?: string[] }).ImageUrls ??
                    [],
                };
              }) ?? [];
            this.quantities = this.products.reduce<Record<number, number>>(
              (acc, product) => {
                acc[product.id] = 0;
                return acc;
              },
              {}
            );
            this.loadBasketForStore();
          },
          error: () => {
            this.products = [];
            this.quantities = {};
          },
        });
    });
  }

  getQuantity(productId: number): number {
    return this.quantities[productId] ?? 0;
  }

  increase(productId: number): void {
    this.updateQuantity(productId, 1);
  }

  decrease(productId: number): void {
    this.updateQuantity(productId, -1);
  }

  private updateQuantity(productId: number, delta: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No user id found. Please log in again.');
      return;
    }

    if (!this.storeId) {
      console.error('No store id found. Please select a store again.');
      return;
    }

    const current = this.getQuantity(productId);
    const nextQuantity = Math.max(0, current + delta);
    if (nextQuantity === current) {
      return;
    }

    const payload: BasketSaveRequest = {
      UserId: userId,
      StoreId: this.storeId,
      DeliveryAddressId: this.deliveryAddressId,
      ProductId: productId,
      Quantity: nextQuantity,
      ProductPrice: this.getProductPrice(productId),
      UnitType: 0,
      Weight: 0,
    };

    this.api.post<BasketSaveResponse>('/order-management/basket/save', payload).subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          console.error(response?.message || 'Unable to save basket item.');
          return;
        }

        this.quantities[productId] = nextQuantity;
      },
      error: (err) => {
        console.error(err?.message || 'Unable to save basket item.');
      },
    });
  }

  private getProductPrice(productId: number): number {
    return this.products.find((product) => product.id === productId)?.price ?? 0;
  }

  private loadBasketForStore(): void {
    debugger
    const userId = this.authService.getUserId();
    if (!userId || !this.storeId) {
      return;
    }

    const params = new HttpParams().set('userId', userId).set('storeId', this.storeId);
    this.api.get<BasketGetOneResponse>('/order-management/basket/getOne', { params }).subscribe({
      next: (response) => {
        const items = response?.items ?? [];
        const nextQuantities = { ...this.quantities };

        for (const item of items) {
          if (Object.prototype.hasOwnProperty.call(nextQuantities, item.productId)) {
            nextQuantities[item.productId] = item.quantity ?? 0;
          }
        }

        this.quantities = nextQuantities;
        if (response?.deliveryAddressId) {
          this.deliveryAddressId = response.deliveryAddressId;
        }
      },
      error: (err) => {
        console.error(err?.message || 'Unable to load basket details.');
      },
    });
  }
}
