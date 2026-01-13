import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    NgFor,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  products = [
    {
      name: 'Organic Strawberries',
      size: '500g',
      price: '$6.90',
      tags: ['Fresh', 'Organic'],
      rating: '4.8',
    },
    {
      name: 'Sourdough Bread',
      size: '1 loaf',
      price: '$4.20',
      tags: ['Bakery', 'Daily'],
      rating: '4.7',
    },
    {
      name: 'Greek Yogurt',
      size: '1kg',
      price: '$5.40',
      tags: ['Dairy', 'Protein'],
      rating: '4.6',
    },
    {
      name: 'Baby Spinach',
      size: '250g',
      price: '$3.10',
      tags: ['Greens', 'Fresh'],
      rating: '4.5',
    },
    {
      name: 'Roasted Almonds',
      size: '300g',
      price: '$7.25',
      tags: ['Snack', 'No sugar'],
      rating: '4.4',
    },
    {
      name: 'Olive Oil',
      size: '750ml',
      price: '$12.80',
      tags: ['Pantry', 'Premium'],
      rating: '4.9',
    },
  ];
}
