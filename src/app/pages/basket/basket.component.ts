import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface BasketItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
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
  private readonly basketPreviewKey = 'basket_preview';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.storeId = params.get('storeId') ?? '';
      this.loadBasket();
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
    this.saveBasket();
  }

  decrease(item: BasketItem): void {
    item.quantity = Math.max(0, item.quantity - 1);
    if (item.quantity === 0) {
      this.basketItems = this.basketItems.filter((entry) => entry.id !== item.id);
    }
    this.saveBasket();
  }

  remove(item: BasketItem): void {
    this.basketItems = this.basketItems.filter((entry) => entry.id !== item.id);
    this.saveBasket();
  }

  private loadBasket(): void {
    const stored = localStorage.getItem(this.basketPreviewKey);
    const parsed: BasketItem[] = stored ? JSON.parse(stored) : [];
    this.basketItems = Array.isArray(parsed) ? parsed : [];
  }

  private saveBasket(): void {
    localStorage.setItem(this.basketPreviewKey, JSON.stringify(this.basketItems));
  }
}
