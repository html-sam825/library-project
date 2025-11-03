import { Component, OnInit, OnDestroy } from '@angular/core';
import { Order } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'user-orders',
  standalone: false,
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy {
  columnsForPendingReturns: string[] = [
    'orderId',
    'bookId',
    'bookTitle',
    'orderDate',
    'approvedDate',
    'fineToPay',
    'orderStatus'
  ];
  
  columnsForReturnedBooks: string[] = [
    'orderId',
    'bookId',
    'bookTitle',
    'orderDate',
    'returnDate',
    'finePaid',
    'orderStatus'
  ];
  
  pendingReturns: Order[] = [];
  completedReturns: Order[] = [];
  isLoading: boolean = true;
  userId: number | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService, 
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserOrders(): void {
    const userInfo = this.dataService.getUserInfo();
    
    if (!userInfo || !userInfo.id) {
      this.showError('Unable to load user information. Please log in again.');
      this.isLoading = false;
      return;
    }

    this.userId = userInfo.id;
    this.isLoading = true;

    this.dataService.getOrdersOfUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Order[]) => {
          this.isLoading = false;
          this.pendingReturns = res.filter((o) => !o.returned);
          this.completedReturns = res.filter((o) => o.returned);
          
          console.log('Loaded orders:', {
            pending: this.pendingReturns.length,
            completed: this.completedReturns.length
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading user orders:', err);
          this.showError('Failed to load your orders. Please try again.');
        }
      });
  }

  getFineToPay(order: Order): number {
    return this.dataService.getFine(order);
  }

  getTotalPendingFines(): number {
    return this.pendingReturns.reduce((total, order) => {
      return total + this.getFineToPay(order);
    }, 0);
  }

 
  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) 
        ? 'Invalid date' 
        : dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch {
      return 'Invalid date';
    }
  }

  
  getDaysRemaining(order: Order): number {
    if (!order.approved_at) return 0;
    
    const approvedDate = new Date(order.approved_at);
    const dueDate = new Date(approvedDate);
    dueDate.setDate(dueDate.getDate() + 10); 
    const today = new Date();
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  
  isOverdue(order: Order): boolean {
    return this.getFineToPay(order) > 0;
  }


  refreshOrders(): void {
    this.loadUserOrders();
    this.showInfo('Refreshing your orders...');
  }

  
  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}