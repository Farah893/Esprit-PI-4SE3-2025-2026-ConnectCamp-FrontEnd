import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Wallet, WalletTransaction, AddFundsDto } from '../models/api.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/api/wallets`;

  constructor(private http: HttpClient) { }

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data ?? ({} as any);
  }

  getMyWallet(): Observable<Wallet> {
    const userId = this.getUserId();
    if (!userId) return of({} as Wallet);
    return this.http.get<ApiResponse<Wallet>>(`${this.apiUrl}/user/${userId}`)
      .pipe(map(res => this.extractData(res)));
  }

  getBalance(): Observable<{ balance: number; loyaltyPoints: number }> {
    const userId = this.getUserId();
    if (!userId) return of({ balance: 0, loyaltyPoints: 0 });
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/user/${userId}/balance`)
      .pipe(map(res => {
        return { balance: res.data ?? 0, loyaltyPoints: 0 };
      }));
  }

  addFunds(data: any): Observable<Wallet> {
    const userId = this.getUserId();
    const amount = typeof data === 'number' ? data : (data?.amount ?? 0);
    return this.http.post<ApiResponse<Wallet>>(`${this.apiUrl}/user/${userId}/add-funds?amount=${amount}`, {})
      .pipe(map(res => this.extractData(res)));
  }

  getTransactions(): Observable<WalletTransaction[]> {
    const userId = this.getUserId();
    if (!userId) return of([]);
    // Use the correct TransactionController path
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/api/transactions/user/${userId}`)
      .pipe(map(res => {
        const raw = res.data;
        return (raw?.content || raw || []) as WalletTransaction[];
      }));
  }

  getTransactionById(id: string): Observable<WalletTransaction> {
    return this.http.get<ApiResponse<WalletTransaction>>(`${environment.apiUrl}/api/transactions/${id}`)
      .pipe(map(res => this.extractData(res)));
  }

  private getUserId(): string | null {
    try {
      const userStr = localStorage.getItem('current_user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id?.toString() || null;
      }
      return null;
    } catch { return null; }
  }
}
