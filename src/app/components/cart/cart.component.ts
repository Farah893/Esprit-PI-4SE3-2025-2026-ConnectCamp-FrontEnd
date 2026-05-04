import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PromotionService } from '../../modules/services/services/promotion.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

interface LocalCartItem {
    id: string;
    name: string;
    image: string;
    type: 'Purchase' | 'Rental';
    rentalDuration?: string;
    quantity: number;
    unitPrice: number;
    originalType: 'PURCHASE' | 'RENTAL';
}

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
    
    private cartSub: Subscription | null = null;
    cartItems: LocalCartItem[] = [];
    
    // Totals from service
    serverSubtotal = 0;
    serverDiscount = 0;
    serverTotal = 0;

    constructor(
        private location: Location,
        private route: ActivatedRoute,
        private promotionService: PromotionService,
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cartService.fetchCart().subscribe();

        this.cartSub = this.cartService.cart$.subscribe(items => {
            this.cartItems = items.map(item => ({
                id: item.productId,
                name: item.productName,
                image: this.cartService.getImageUrl(item.image),
                type: item.type === 'RENTAL' ? 'Rental' : 'Purchase',
                rentalDuration: item.rentalDays ? `${item.rentalDays} days` : undefined,
                quantity: item.quantity,
                unitPrice: item.price,
                originalType: item.type
            }));
        });

        // Sync totals
        this.cartService.cartTotal$.subscribe(v => this.serverSubtotal = v);
        this.cartService.cartDiscount$.subscribe(v => this.serverDiscount = v);
        this.cartService.cartFinal$.subscribe(v => this.serverTotal = v);

        this.route.queryParams.subscribe(params => {
            if (params['code']) {
                this.promoCode = params['code'];
                this.applyPromo();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.cartSub) this.cartSub.unsubscribe();
    }

    // ── Promo code ────────────────────────────────────────────────────────────
    promoCode = '';
    promoLoading = false;
    promoResult: { valide: boolean; message: string; reduction?: number; montantFinal?: number; promotionName?: string } | null = null;

    get discount(): number {
        return this.serverDiscount > 0 ? this.serverDiscount : (this.promoResult?.reduction || 0);
    }

    applyPromo(): void {
        if (!this.promoCode.trim()) return;
        this.promoLoading = true;
        this.promoResult = null;
        
        if (this.subtotal === 0) {
            this.promoResult = { valide: false, message: 'Panier vide.' };
            this.promoLoading = false;
            return;
        }

        this.promotionService.validateCode(this.promoCode.trim(), this.subtotal).subscribe({
            next: (res) => { 
                this.promoResult = res; 
                this.promoLoading = false;
                // Refresh cart to get backend-calculated discount
                this.cartService.fetchCart().subscribe();
            },
            error: () => {
                this.promoResult = { valide: false, message: 'Code invalide.' };
                this.promoLoading = false;
            }
        });
    }

    removePromo(): void {
        this.promoCode = '';
        this.promoResult = null;
        this.cartService.fetchCart().subscribe();
    }

    // ── Cart items ────────────────────────────────────────────────────────────
    get subtotal(): number {
        return this.serverSubtotal > 0 ? this.serverSubtotal : this.cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    }

    shipping = 15.00;
    taxRate = 0.10;

    get tax(): number { return this.subtotal > 0 ? this.subtotal * this.taxRate : 0; }

    get total(): number {
        if (this.serverTotal > 0) return this.serverTotal;
        if (this.subtotal === 0) return 0;
        return Math.max(0, this.subtotal + this.shipping + this.tax - this.discount);
    }

    get pointsToEarn(): number { return Math.floor(this.total); }

    incrementQuantity(item: LocalCartItem) { 
        this.cartService.updateQuantity(item.id, item.quantity + 1, item.originalType).subscribe();
    }

    decrementQuantity(item: LocalCartItem) { 
        if (item.quantity > 1) {
            this.cartService.updateQuantity(item.id, item.quantity - 1, item.originalType).subscribe();
        }
    }

    removeItem(item: LocalCartItem) { 
        this.cartService.removeItem(item.id, item.originalType).subscribe();
    }

    clearCart() { 
        if(confirm('Voulez-vous vraiment vider votre panier ?')) {
            this.cartService.clearCart().subscribe();
            this.removePromo();
            this.orderSuccess = false;
        }
    }

    // ── Payment ───────────────────────────────────────────────────────────────
    selectedPayment: 'wallet' | 'card' = 'wallet';
    walletBalance = 250.00;

    // Card form fields
    cardNumber = '';
    cardName = '';
    cardExpiry = '';
    cardCvv = '';

    payLoading = false;
    orderSuccess = false;
    orderNumber = '';

    get canPayWallet(): boolean {
        return this.walletBalance >= this.total && this.cartItems.length > 0;
    }

    get canPayCard(): boolean {
        return this.cartItems.length > 0 &&
            this.cardNumber.replace(/\s/g, '').length === 16 &&
            this.cardName.trim().length > 0 &&
            this.cardExpiry.length === 5 &&
            this.cardCvv.length >= 3;
    }

    get canPay(): boolean {
        if (this.cartItems.length === 0) return false;
        return this.selectedPayment === 'wallet' ? this.canPayWallet : this.canPayCard;
    }

    get insufficientBalance(): boolean {
        return this.selectedPayment === 'wallet' && this.walletBalance < this.total && this.cartItems.length > 0;
    }

    formatCardNumber(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').substring(0, 16);
        this.cardNumber = value.replace(/(.{4})/g, '$1 ').trim();
    }

    formatExpiry(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').substring(0, 4);
        if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
        this.cardExpiry = value;
    }

    pay(): void {
        if (!this.canPay) return;
        this.payLoading = true;

        setTimeout(() => {
            if (this.selectedPayment === 'wallet') {
                this.walletBalance -= this.total;
            }
            this.orderNumber = 'CC-' + Date.now().toString().slice(-8);
            this.orderSuccess = true;
            this.payLoading = false;
            
            // Clear actual cart on success
            this.cartService.clearCart().subscribe();
            this.removePromo();
        }, 1500);
    }

    goBack() { this.location.back(); }
}
