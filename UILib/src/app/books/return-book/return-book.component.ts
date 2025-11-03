import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order } from '../../service/models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-return-book',
  standalone: false,
  templateUrl: './return-book.component.html',
  styleUrls: ['./return-book.component.scss']
})
export class ReturnBookComponent implements OnDestroy {
  returnForm: FormGroup;
  fineToPay: number | null = null;
  isLoading: boolean = false;
  currentOrder: Order | null = null;
  currentOrderId: number | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService, 
    private snackBar: MatSnackBar
  ) {
    this.returnForm = this.fb.group({
      bookId: [null, [Validators.required, Validators.min(1)]],
      userId: [null, [Validators.required, Validators.min(1)]],
      returnDate: [new Date()]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFine(): void {
    if (this.returnForm.invalid) {
      this.markFormGroupTouched();
      this.showError('Please enter valid User ID and Book ID');
      return;
    }

    const userId = this.returnForm.get('userId')?.value;
    const bookId = this.returnForm.get('bookId')?.value;

    this.isLoading = true;
    this.fineToPay = null;
    this.currentOrder = null;
    this.currentOrderId = null;

    this.dataService.getOrdersOfUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders: Order[]) => {
          this.isLoading = false;
          console.log(' User orders:', orders);
          
          
          const activeOrder = orders.find(order => 
            !order.returned && 
            order.bookId == bookId && 
            order.status === 'APPROVED'
          );
          
          if (activeOrder) {
            this.currentOrder = activeOrder;
            this.currentOrderId = activeOrder.id;
            this.fineToPay = this.dataService.getFine(activeOrder);
            
            console.log(' Found active order:', activeOrder);
            console.log(' Calculated fine:', this.fineToPay);
            
            if (this.fineToPay > 0) {
              this.showInfo(`Fine calculated: Kshs ${this.fineToPay}`);
            } else {
              this.showSuccess('No fine applicable. Book can be returned.');
            }
          } else {
            console.log(' No active order found');
            this.showError(`No active approved order found for User ID: ${userId} and Book ID: ${bookId}`);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching orders:', err);
          this.showError('Failed to fetch order details. Please try again.');
        }
      });
  }

  returnBook(): void {
    if (this.returnForm.invalid) {
      this.markFormGroupTouched();
      this.showError('Please enter valid User ID and Book ID');
      return;
    }

    if (this.fineToPay === null || !this.currentOrderId) {
      this.showError('Please calculate fine first to find the order');
      return;
    }

    const userId = this.returnForm.get('userId')?.value;
    const bookId = this.returnForm.get('bookId')?.value;
    const finePaid = this.fineToPay > 0;

  
    if (finePaid) {
      const confirmMessage = `Book has a fine of Kshs ${this.fineToPay}. Has the fine been paid?`;
      if (!confirm(confirmMessage)) {
        this.showInfo('Please ensure fine is paid before returning the book.');
        return;
      }
    }

    this.isLoading = true;

    
    this.dataService.returnBookByOrderId(this.currentOrderId, finePaid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log(' Return response:', response);
          
          if (response.message && response.message.includes('successfully')) {
            const successMessage = finePaid 
              ? `Book returned successfully! Fine of Kshs ${this.fineToPay} processed.`
              : 'Book returned successfully! No fine applied.';
              
            this.showSuccess(successMessage);
            this.resetForm();
          } else {
            this.showError('Book return processed but unexpected response.');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error(' Error returning book:', error);
          
          let errorMessage = 'Failed to return book. Please try again.';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 404) {
            errorMessage = 'Order not found. Please check the User ID and Book ID.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

 
  returnBookAlternative(): void {
    if (this.returnForm.invalid || this.fineToPay === null) {
      this.showError('Please calculate fine first');
      return;
    }

    const userId = this.returnForm.get('userId')?.value;
    const bookId = this.returnForm.get('bookId')?.value;
    const finePaid = this.fineToPay > 0;

    if (finePaid && !confirm(`Fine of Kshs ${this.fineToPay} will be processed. Continue?`)) {
      return;
    }

    this.isLoading = true;

    this.dataService.returnBook(userId, bookId, this.fineToPay)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log(' Return response:', response);
          
          this.showSuccess('Book returned successfully!');
          this.resetForm();
        },
        error: (error) => {
          this.isLoading = false;
          console.error(' Error returning book:', error);
          this.showError(error.error?.message || 'Failed to return book');
        }
      });
  }

  private resetForm(): void {
    this.returnForm.reset();
    this.fineToPay = null;
    this.currentOrder = null;
    this.currentOrderId = null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.returnForm.controls).forEach(key => {
      this.returnForm.get(key)?.markAsTouched();
    });
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
      duration: 5000,
      panelClass: ['info-snackbar']
    });
  }

  get userId() { return this.returnForm.get('userId'); }
  get bookId() { return this.returnForm.get('bookId'); }

  get isFineCalculated(): boolean {
    return this.fineToPay !== null;
  }

  get fineAmount(): number {
    return this.fineToPay ?? 0;
  }
}