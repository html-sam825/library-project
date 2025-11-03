  import { Component, OnInit, OnDestroy } from '@angular/core';
  import { Order } from '../../service/models';
  import { DataService } from '../../service/data.service';
  import { MatSnackBar } from '@angular/material/snack-bar';
  import { Subject, takeUntil } from 'rxjs';

  @Component({
    selector: 'order-approvals',
    standalone: false,
    templateUrl: './order-approvals.component.html',
    styleUrls: ['./order-approvals.component.scss']
  })
  export class OrderApprovalsComponent implements OnInit, OnDestroy {
    columns: string[] = [
      'id',
      'userNameForOrder',
      'bookTitle',
      'orderDate',
      'orderStatus',
      'approveOrder',
      'rejectOrder'
    ];
    
    pendingOrders: Order[] = [];
    isLoading: boolean = true;
    private destroy$ = new Subject<void>();

    constructor(
      private dataService: DataService,
      private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
      this.loadPendingOrders();
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    loadPendingOrders(): void {
      this.isLoading = true;
      this.dataService.getPendingOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders: Order[]) => {
            this.isLoading = false;
            this.pendingOrders = orders;
            console.log('Pending orders loaded:', this.pendingOrders);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error loading pending orders:', err);
            this.showError('Failed to load pending orders. Please try again.');
          }
        });
    }

    approveOrder(order: Order): void {
      const confirmMessage = `Approve order for "${order.bookTitle}" by ${order.userName}?`;
      if (!confirm(confirmMessage)) {
        return;
      }

      this.dataService.approveOrder(order.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.success || res.message?.includes('approved')) {
              this.showSuccess(`Order approved successfully!`);
              
              this.pendingOrders = this.pendingOrders.filter(o => o.id !== order.id);
            } else {
              this.showError('Failed to approve order. Please try again.');
            }
          },
          error: (err) => {
            console.error('Error approving order:', err);
            this.showError('Failed to approve order. Please try again.');
          }
        });
    }

    rejectOrder(order: Order): void {
      const confirmMessage = `Reject order for "${order.bookTitle}" by ${order.userName}?`;
      if (!confirm(confirmMessage)) {
        return;
      }

      this.dataService.rejectOrder(order.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.success || res.message?.includes('rejected')) {
              this.showSuccess(`Order rejected successfully!`);
              
              this.pendingOrders = this.pendingOrders.filter(o => o.id !== order.id);
            } else {
              this.showError('Failed to reject order. Please try again.');
            }
          },
          error: (err) => {
            console.error('Error rejecting order:', err);
            this.showError('Failed to reject order. Please try again.');
          }
        });
    }

    refresh(): void {
      this.loadPendingOrders();
      this.showInfo('Refreshing pending orders...');
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
  }