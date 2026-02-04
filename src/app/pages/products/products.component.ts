import { NgFor, NgIf } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

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

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute
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
                const raw = product as { Id?: number | string; ID?: number | string };
                const resolvedId = product.id ?? raw.Id ?? raw.ID ?? index;
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
    this.quantities[productId] = this.getQuantity(productId) + 1;
  }

  decrease(productId: number): void {
    const current = this.getQuantity(productId);
    this.quantities[productId] = current <= 1 ? 0 : current - 1;
  }
}
