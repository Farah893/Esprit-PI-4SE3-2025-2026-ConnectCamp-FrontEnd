// cart.component.ts
import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

// ✅ Define interface locally — do NOT import CartItem from api.models
//    as that type has different fields (productId, productName, etc.)
interface CartItem {
  id: number;
  name: string;
  image: string;
  type: 'Purchase' | 'Rental';
  rentalDuration?: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  cartItems: CartItem[] = [
    {
      id: 1,
      name: "Waterproof Hiking Boots - Men's",
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080',
      type: 'Purchase',
      quantity: 2,
      unitPrice: 143.10
    },
    {
      id: 2,
      name: 'Camping Cookware Set - 4 Pieces',
      image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1080',
      type: 'Rental',
      rentalDuration: '7 days',
      quantity: 3,
      unitPrice: 12.00
    }
  ];

  walletBalance = 250.00;
  shipping = 15.00;
  taxRate = 0.10;

  get subtotal(): number {
    return this.cartItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity, 0
    );
  }

  get tax(): number {
    return this.subtotal * this.taxRate;
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax;
  }

  get pointsToEarn(): number {
    return Math.floor(this.total);
  }

  // ✅ Called by template: {{ getLineTotal(item) | number:'1.2-2' }}
  getLineTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  incrementQuantity(item: CartItem): void {
    item.quantity++;
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter(i => i.id !== item.id);
  }

  clearCart(): void {
    this.cartItems = [];
  }
}
