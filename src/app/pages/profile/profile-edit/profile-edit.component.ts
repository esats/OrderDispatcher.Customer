import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

interface GetUserResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: Record<string, unknown> | null;
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
})
export class ProfileEditComponent implements OnInit {
  loading = true;
  errorMessage = '';
  successMessage = '';
  saving = false;
  profile: Record<string, unknown> | null = null;
  form = new FormGroup({
    UserId: new FormControl(''),
    FirstName: new FormControl(''),
    LastName: new FormControl(''),
    PhoneNumber: new FormControl(''),
  });

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.loading = false;
      this.errorMessage = 'No user id found. Please log in again.';
      return;
    }

    this.api.get<GetUserResponse>(`/auth/profile/getOne/${userId}`).subscribe({
      next: (response) => {
        this.successMessage = '';
        if (response?.isSuccess === false) {
          this.errorMessage =
            response?.message || 'Unable to load profile details.';
          return;
        }

        this.profile = response?.value ?? null;
        this.form.setValue({
          UserId: this.readField(this.profile, ['userId']),
          FirstName: this.readField(this.profile, ['firstName']),
          LastName: this.readField(this.profile, ['lastName']),
          PhoneNumber: this.readField(this.profile, ['phoneNumber']),
        });
      },
      error: (err) => {
        this.errorMessage =
          err?.message || 'Unable to load profile details.';
      },
    }).add(() => {
      this.loading = false;
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.form.getRawValue();

    this.api.post<GetUserResponse>('/auth/profile/save', payload).subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          this.errorMessage =
            response?.message || 'Unable to save profile details.';
          return;
        }

        this.successMessage = 'Profile saved successfully.';
      },
      error: (err) => {
        this.errorMessage =
          err?.message || 'Unable to save profile details.';
      },
    }).add(() => {
      this.saving = false;
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
}
