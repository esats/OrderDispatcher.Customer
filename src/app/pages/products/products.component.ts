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
        return;
      }

      const httpParams = new HttpParams().set('storeId', storeId);
      this.api
        .get<CatalogProduct[]>('/aggregate/catalog/products-with-images', { params: httpParams })
        .subscribe({
          next: (products) => {
            this.products =
              products?.map((product) => ({
                ...product,
                imageUrls:
                  product.imageUrls ??
                  (product as { ImageUrls?: string[] }).ImageUrls ??
                  [],
              })) ?? [];
          },
          error: () => {
            this.products = [];
          },
        });
    });
  }
}
