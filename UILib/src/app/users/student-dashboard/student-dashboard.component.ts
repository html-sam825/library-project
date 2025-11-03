import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

interface DashboardStats {
  currentBooks: number;
  pendingOrders: number;
  overdueBooks: number;
  totalFines: number;
  booksRemaining: number;
}

interface AccountInfo {
  userType: string;
  status: string;
  statusClass: string;
  statusIcon: string;
  bookLimit: number;
  fines: number;
}

interface BookOrder {
  id: number;
  bookTitle: string;
  orderDate: string;
  returnDate?: string;
  status: string;
  fine_amount?: number;
}

@Component({
  selector: 'student-dashboard',
  standalone: false,
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  studentName: string = 'Loading...';
  stats: DashboardStats = {
    currentBooks: 0,
    pendingOrders: 0,
    overdueBooks: 0,
    totalFines: 0,
    booksRemaining: 0
  };

  currentBooks: BookOrder[] = [];
  pendingOrders: BookOrder[] = [];
  accountInfo: AccountInfo = {
    userType: 'Student',
    status: 'Loading...',
    statusClass: 'neutral',
    statusIcon: 'hourglass_empty',
    bookLimit: 0,
    fines: 0
  };

  isLoading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    const user = this.dataService.getUserInfo();
    if (user) {
      this.studentName = `${user.firstName} ${user.lastName}`;
      this.updateAccountInfo(user);
    }

    
    if (user?.id) {
      this.dataService.getUserOrdersWithBooks(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders: any[]) => {
            this.processOrders(orders);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading dashboard data:', error);
            this.isLoading = false;
            this.showError('Failed to load dashboard data');
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  private processOrders(orders: any[]): void {
    this.currentBooks = [];
    this.pendingOrders = [];
    let totalFines = 0;
    let overdueCount = 0;

    orders.forEach(order => {
      const bookOrder: BookOrder = {
        id: order.id,
        bookTitle: order.bookTitle,
        orderDate: order.orderDate,
        returnDate: order.returnDate,
        status: order.status,
        fine_amount: order.fine_amount
      };

      if (order.status === 'APPROVED' && !order.returned) {
        this.currentBooks.push(bookOrder);
        
     
        if (this.isBookOverdue(bookOrder)) {
          overdueCount++;
          if (order.fine_amount) {
            totalFines += order.fine_amount;
          }
        }
      } else if (order.status === 'PENDING') {
        this.pendingOrders.push(bookOrder);
      }
    });

    const user = this.dataService.getUserInfo();
    const bookLimit = user?.max_books_limit || 3;
    const booksRemaining = Math.max(0, bookLimit - this.currentBooks.length);

    this.stats = {
      currentBooks: this.currentBooks.length,
      pendingOrders: this.pendingOrders.length,
      overdueBooks: overdueCount,
      totalFines: totalFines,
      booksRemaining: booksRemaining
    };

   
    if (this.accountInfo) {
      this.accountInfo.fines = totalFines;
    }
  }

  private updateAccountInfo(user: any): void {
    let statusClass = 'neutral';
    let statusIcon = 'hourglass_empty';
    let statusText = 'Loading...';

    switch (user.accountStatus) {
      case 'APPROVED':
        statusClass = 'success';
        statusIcon = 'check_circle';
        statusText = 'Active';
        break;
      case 'UNAPPROVED':
        statusClass = 'warning';
        statusIcon = 'pending';
        statusText = 'Pending Approval';
        break;
      case 'BLOCKED':
        statusClass = 'warning';
        statusIcon = 'block';
        statusText = 'Blocked';
        break;
    }

    this.accountInfo = {
      userType: user.userType === 'ADMIN' ? 'Administrator' : 'Student',
      status: statusText,
      statusClass: statusClass,
      statusIcon: statusIcon,
      bookLimit: user.max_books_limit || 3,
      fines: 0
    };
  }

  isBookOverdue(book: BookOrder): boolean {
    if (!book.returnDate) return false;
    
    const returnDate = new Date(book.returnDate);
    const today = new Date();
    return returnDate < today;
  }

  returnBook(book: BookOrder): void {
    const user = this.dataService.getUserInfo();
    if (!user) {
      this.showError('Please log in to return books.');
      return;
    }

    const fineAmount = book.fine_amount || 0;
    const isOverdue = this.isBookOverdue(book);

    if (isOverdue && fineAmount > 0) {
      const confirmMessage = `This book is overdue with a fine of Kshs ${fineAmount}. Are you sure you want to return it?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    this.dataService.returnBookByOrderId(book.id, fineAmount > 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.message?.includes('successfully')) {
            this.showSuccess('Book returned successfully!');
            this.loadDashboardData(); 
          } else {
            this.showError(response.message || 'Failed to return book');
          }
        },
        error: (error) => {
          console.error('Error returning book:', error);
          this.showError(error.error?.message || 'Failed to return book');
        }
      });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([`/${route}`]);
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
}