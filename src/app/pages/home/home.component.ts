import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface StoreWithImages {
  userId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  userName?: string;
  imageMasterId?: number;
  imageUrls?: string[];
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

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.get<StoreWithImages[]>('/aggregate/engagement/stores-with-images').subscribe({
      next: (stores) => {
        debugger
        this.stores = stores ?? [];
      },
      error: () => {
        this.stores = [];
      },
    });
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
}
