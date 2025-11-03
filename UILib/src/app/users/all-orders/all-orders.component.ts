import { Component, OnInit, OnDestroy } from '@angular/core';
import { Order } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'all-orders',
  standalone: false,
  templateUrl: './all-orders.component.html',
  styleUrls: ['./all-orders.component.scss']
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  columnsForPendingReturns: string[] = [
    'id',
    'userIdForOrder',
    'userNameForOrder',
    'bookId',
    'bookTitle',
    'orderDate',
    'approvedDate',
    'fineToPay',
    'orderStatus'
  ];

  columnsForCompletedReturns: string[] = [
    'id',
    'userIdForOrder',
    'userNameForOrder',
    'bookId',
    'bookTitle',
    'orderDate',
    'approvedDate',
    'returnDate',
    'finePaid',
    'orderStatus'
  ];

  showProgressBar: boolean = false;
  ordersWithPendingReturns: Order[] = [];
  orderWithCompletedReturns: Order[] = [];
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService, 
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    
    this.dataService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Order[]) => {
          this.isLoading = false;
          this.ordersWithPendingReturns = res.filter(o => !o.returned);
          this.orderWithCompletedReturns = res.filter(o => o.returned);
        },
        error: (err: any) => { 
          this.isLoading = false;
          console.error('Error loading orders:', err);
          this.showError('Failed to load orders. Please try again.');
        }
      });
  }

  sendEmail(): void {
    if (this.ordersWithPendingReturns.length === 0) {
      this.showInfo('No pending orders to send emails for.');
      return;
    }

    this.showProgressBar = true;
    
    this.dataService.sendEmail()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showProgressBar = false;
          
          if (res.message?.includes('sent') || res === 'sent') {
            this.showSuccess(
              `Reminder emails sent to ${this.ordersWithPendingReturns.length} students with pending returns!`
            );
          } else {
            this.showError('Failed to send emails. Please try again.');
          }
        },
        error: (err: any) => { 
          this.showProgressBar = false;
          console.error('Error sending emails:', err);
          this.showError('Failed to send emails. Please try again.');
        }
      });
  }

  blockUsers(): void {
    if (this.ordersWithPendingReturns.length === 0) {
      this.showInfo('No pending orders to check for blocking.');
      return;
    }

    const confirmMessage = `This will block users with overdue books and fines exceeding 500Rs. Continue?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.showProgressBar = true;
    
    this.dataService.blockUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showProgressBar = false;
          
          if (res.message?.includes('blocked') || res === 'blocked') {
            const blockedCount = res.blocked_users_count || 'some';
            this.showSuccess(`Successfully blocked ${blockedCount} users with overdue fines!`);
            this.loadOrders();
          } else {
            this.showError('No users were blocked. They may have already been blocked or paid fines.');
          }
        },
        error: (err: any) => { 
          
          this.showProgressBar = false;
          console.error('Error blocking users:', err);
          this.showError('Failed to block users. Please try again.');
        }
      });
  }

  getPendingReturnsCount(): number {
    return this.ordersWithPendingReturns.length;
  }

  getCompletedReturnsCount(): number {
    return this.orderWithCompletedReturns.length;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['success-snackbar']
    });
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

  getTotalPendingFines(): number {
    return this.ordersWithPendingReturns.reduce((total, order) => {
      return total + (this.dataService.getFine(order) || 0);
    }, 0);
  }

  refreshOrders(): void {
    this.loadOrders();
  }
}