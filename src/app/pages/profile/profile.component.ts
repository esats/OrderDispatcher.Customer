import { NgFor, NgIf } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface GetUserResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: Record<string, unknown> | null;
}

interface AddressItem {
  title: string;
  addressLine: string;
}

interface GetAddressesResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: AddressItem[] | null;
}

interface CustomerOrdersResponse {
  customerId: string;
  orders: OrderDetail[];
}

interface OrderDetail {
  id: number;
  storeId: string;
  storeName: string;
  storeImageUrl: string;
  customerId: string;
  shopperId?: string | null;
  basketMasterId: number;
  assignedAtUtc?: string | null;
  status: number;
  subtotal?: number | null;
  deliveryFee?: number | null;
  serviceFee?: number | null;
  tip?: number | null;
  total?: number | null;
  notes?: string | null;
}

interface RecentOrderItem {
  title: string;
  subtitle: string;
  chipLabel: string;
  storeImageUrl: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    RouterLink,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  fullName = '';
  phoneNumber = '';
  sinceYear = '';
  errorMessage = '';
  addresses: AddressItem[] = [];
  totalOrders = 0;
  recentOrders: RecentOrderItem[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'No user id found. Please log in again.';
      return;
    }

    this.api.get<GetUserResponse>(`/engagement/profile/getOne/${userId}`).subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          this.errorMessage =
            response?.message || 'Unable to load profile details.';
          return;
        }

        const profile = response?.value ?? null;
        const firstName = this.readField(profile, ['firstName', 'FirstName']);
        const lastName = this.readField(profile, ['lastName', 'LastName']);
        this.fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const phoneRaw = this.readField(profile, [
          'phoneNumber',
          'PhoneNumber',
        ]);
        this.phoneNumber = this.formatPhoneNumber(phoneRaw);

        const createdAt = this.readField(profile, [
          'createdAtUtc',
          'CreatedAtUtc',
        ]);
        this.sinceYear = this.extractYear(createdAt);
      },
      error: (err) => {
        this.errorMessage =
          err?.message || 'Unable to load profile details.';
      },
    });

    this.api.get<GetAddressesResponse>('/engagement/profile/getAllAddresses').subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          return;
        }

        this.addresses = response?.value ?? [];
      },
      error: () => {
        this.addresses = [];
      },
    });

    this.loadCustomerOrders(userId);
  }

  private readField(
    profile: Record<string, unknown> | null,
    keys: string[]
  ): string {
    if (!profile) {
      return '';
    }

    for (const key of keys) {
      const value = profile[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    return '';
  }

  private extractYear(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return String(parsed.getUTCFullYear());
    }

    const yearMatch = value.match(/\b\d{4}\b/);
    return yearMatch ? yearMatch[0] : '';
  }

  private formatPhoneNumber(value: string): string {
    if (!value) {
      return '';
    }

    const digits = value.replace(/\D/g, '');
    const normalized =
      digits.length === 11 && digits.startsWith('1')
        ? digits.slice(1)
        : digits;

    if (normalized.length === 10) {
      return `(${normalized.slice(0, 3)}) ${normalized.slice(
        3,
        6
      )}-${normalized.slice(6)}`;
    }

    return value;
  }

  private loadCustomerOrders(userId: string): void {
    const params = new HttpParams().set('customerId', userId);
    this.api
      .get<CustomerOrdersResponse>('/aggregate/order-management/customerOrders', {
        params,
      })
      .subscribe({
        next: (response) => {
          const orders = response?.orders ?? [];
          const mappedOrders = orders
            .map((order, index) => this.mapOrder(order, index))
            .sort((a, b) => b.sortTime - a.sortTime);

          this.totalOrders = orders.length;
          this.recentOrders = mappedOrders.slice(0, 5).map((order) => ({
            title: order.title,
            subtitle: order.subtitle,
            chipLabel: order.chipLabel,
            storeImageUrl: order.storeImageUrl,
          }));
        },
        error: () => {
          this.totalOrders = 0;
          this.recentOrders = [];
        },
      });
  }

  private mapOrder(order: OrderDetail, index: number): {
    title: string;
    subtitle: string;
    chipLabel: string;
    storeImageUrl: string;
    sortTime: number;
  } {
    const title = order.storeName || `Order ${index + 1}`;
    const status = this.getOrderStatusLabel(order.status);
    const dateRaw = order.assignedAtUtc ?? '';
    const dateText = this.formatOrderDate(dateRaw);
    const totalText = this.formatCurrency(order.total);
    const subtitle = [dateText, totalText].filter(Boolean).join(' - ') || 'Recent order';

    const parsedTime = dateRaw ? new Date(dateRaw).getTime() : NaN;
    return {
      title,
      subtitle,
      chipLabel: status,
      storeImageUrl: order.storeImageUrl || '',
      sortTime: Number.isNaN(parsedTime) ? 0 : parsedTime,
    };
  }

  private formatOrderDate(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString();
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return `$${value.toFixed(2)}`;
  }

  private getOrderStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Assigned';
      case 2:
        return 'In progress';
      case 3:
        return 'Delivered';
      case 4:
        return 'Cancelled';
      default:
        return `Status ${status}`;
    }
  }
}
