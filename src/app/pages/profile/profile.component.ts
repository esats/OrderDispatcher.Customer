import { NgFor } from '@angular/common';
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgFor,
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
}
