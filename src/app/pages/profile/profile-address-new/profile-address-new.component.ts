import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface SaveAddressResponse {
  isSuccess?: boolean;
  message?: string | null;
  value?: Record<string, unknown> | null;
}

@Component({
  selector: 'app-profile-address-new',
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
  templateUrl: './profile-address-new.component.html',
  styleUrl: './profile-address-new.component.css',
})
export class ProfileAddressNewComponent {
  errorMessage = '';
  successMessage = '';
  saving = false;
  form = new FormGroup({
    Title: new FormControl('', Validators.required),
    Address: new FormControl('', Validators.required),
  });

  constructor(private readonly api: ApiService) {}

  saveAddress(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.form.getRawValue();

    this.api.post<SaveAddressResponse>('/auth/profile/saveAddress/', payload).subscribe({
      next: (response) => {
        if (response?.isSuccess === false) {
          this.errorMessage =
            response?.message || 'Unable to save address.';
          return;
        }

        this.successMessage = 'Address saved successfully.';
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Unable to save address.';
      },
    }).add(() => {
      this.saving = false;
    });
  }
}
