import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgFor,
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
export class HomeComponent {
  stores = [
    {
      name: 'Metro Market',
      short: 'MM',
      meta: 'Fresh products, daily delivery',
      tags: ['Express', 'Organic'],
      delivery: '30-45 min',
      distance: '2.1 km',
      rating: '4.8',
    },
    {
      name: 'Green Basket',
      short: 'GB',
      meta: 'Healthy snacks',
      tags: ['New', 'Vegan'],
      delivery: '35-55 min',
      distance: '3.4 km',
      rating: '4.6',
    },
    {
      name: 'City Grocers',
      short: 'CG',
      meta: 'Wide product selection',
      tags: ['Discount', '24/7'],
      delivery: '45-60 min',
      distance: '4.2 km',
      rating: '4.7',
    },
    {
      name: 'Bakery Station',
      short: 'BS',
      meta: 'Fresh from the bakery',
      tags: ['Bakery', 'Daily'],
      delivery: '25-40 min',
      distance: '1.3 km',
      rating: '4.9',
    },
    {
      name: 'Freshline',
      short: 'FL',
      meta: 'Produce and dairy',
      tags: ['Dairy', 'Produce'],
      delivery: '40-55 min',
      distance: '3.9 km',
      rating: '4.5',
    },
    {
      name: 'Bulk Depot',
      short: 'BD',
      meta: 'Family-size packs',
      tags: ['Value', 'Bulk'],
      delivery: '50-70 min',
      distance: '5.6 km',
      rating: '4.4',
    },
  ];
}
