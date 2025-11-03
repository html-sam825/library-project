import { Component, OnInit, OnDestroy } from '@angular/core';
import { Book, BooksByCategory, Order } from '../../service/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../service/data.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'book-store',
  standalone: false,
  templateUrl: './book-store.component.html',
  styleUrls: ['./book-store.component.scss']
})
export class BookStoreComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'id',
    'title',
    'author',
    'price',
    'available',
    'order'
  ];  
  
  books: Book[] = [];
  booksToDisplay: BooksByCategory[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  currentUserId: number | null = null;
  userOrders: Order[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService, 
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.dataService.getUserInfo();
    this.currentUserId = user?.id || null;
    this.loadBooksAndOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBooksAndOrders(): void {
    this.isLoading = true;
    
    this.dataService.getBooks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books: Book[]) => {
          this.books = [...books];
          
          if (this.currentUserId) {
            this.loadUserOrders();
          } else {
            this.updateBookStatus();
            this.updateList();
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error loading books:', err);
          this.showError('Failed to load books. Please try again.');
          this.isLoading = false;
        }
      });
  }

  loadUserOrders(): void {
    this.dataService.getUserOrdersWithBooks(this.currentUserId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders: any[]) => {
          this.userOrders = orders;
          console.log(' User orders loaded:', this.userOrders);
          this.updateBookStatus();
          this.updateList();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading user orders:', err);
          this.updateBookStatus();
          this.updateList();
          this.isLoading = false;
        }
      });
  }

  updateBookStatus(): void {
    
    this.books.forEach(book => {
      book.ordered = false;
      book.orderStatus = undefined;
      book.orderedBy = undefined;
      book.orderDate = undefined;
      book.returnDate = undefined;
    });

   
    this.dataService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allOrders: Order[]) => {
          
          allOrders.forEach(order => {
            if (order.status === 'APPROVED' && !order.returned) {
              const book = this.books.find(b => b.id === order.bookId);
              if (book) {
                book.ordered = true;
                book.orderStatus = 'UNAVAILABLE';
                book.orderedBy = order.userId;
                book.orderDate = order.orderDate;
                book.returnDate = order.returnDate;
              }
            }
          });

          
          this.userOrders.forEach(order => {
            const book = this.books.find(b => b.id === order.bookId);
            if (book) {
              book.ordered = true;
              book.orderStatus = this.mapBackendStatusToBookStatus(order.status);
              book.orderedBy = order.userId;
              book.orderDate = order.orderDate;
              book.returnDate = order.returnDate;
              
              console.log(`Book ${book.title} status updated to:`, book.orderStatus);
            }
          });

          this.updateList();
        },
        error: (err) => {
          console.error('Error loading all orders:', err);
         
          this.applyUserOrdersOnly();
          this.updateList();
        }
      });
  }

  private applyUserOrdersOnly(): void {
    this.userOrders.forEach(order => {
      const book = this.books.find(b => b.id === order.bookId);
      if (book) {
        book.ordered = true;
        book.orderStatus = this.mapBackendStatusToBookStatus(order.status);
        book.orderedBy = order.userId;
        book.orderDate = order.orderDate;
        book.returnDate = order.returnDate;
      }
    });
  }

  private hasReachedBookLimit(): boolean {
    if (!this.currentUserId) return true;

    
    const borrowedBooksCount = this.userOrders.filter(order => 
      order.status === 'APPROVED' && !order.returned
    ).length;

    console.log(`User has ${borrowedBooksCount} borrowed books out of 3 limit`);
    
    return borrowedBooksCount >= 3;
  }

  private mapBackendStatusToBookStatus(status: string | undefined): Book['orderStatus'] {
    if (!status) {
      return 'UNAVAILABLE';
    }
    
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'PENDING';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      case 'RETURNED':
        return 'RETURNED';
      case 'OVERDUE':
        return 'OVERDUE';
      default:
        return 'UNAVAILABLE';
    }
  }

  updateList(): void {
    const categoryMap = new Map<number, BooksByCategory>();
    
    for (let book of this.books) {
      const categoryId = book.bookCategoryId;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          bookCategoryId: categoryId,
          category: book.bookCategory?.category || 'Unknown',
          subCategory: book.bookCategory?.subCategory || 'Unknown',
          books: []
        });
      }
      
      categoryMap.get(categoryId)!.books.push(book);
    }
    
    this.booksToDisplay = Array.from(categoryMap.values());
  }

  searchBooks(value: string): void {
    this.searchTerm = value;
    const searchValue = value.toLowerCase().trim();
    
    if (!searchValue) {
      this.updateList();
      return;
    }

    this.booksToDisplay = this.booksToDisplay
      .map(category => ({
        ...category,
        books: category.books.filter(book => 
          book.title.toLowerCase().includes(searchValue) ||
          book.author.toLowerCase().includes(searchValue) ||
          (book.bookCategory?.category?.toLowerCase().includes(searchValue)) ||
          (book.bookCategory?.subCategory?.toLowerCase().includes(searchValue))
        )
      }))
      .filter(category => category.books.length > 0);
  }

  getBookCount(): number {
    return this.booksToDisplay.reduce((count, category) => count + category.books.length, 0);
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

  orderBook(book: Book): void {
    console.log('=== ORDER BOOK COMPONENT DEBUG ===');
    
    if (this.isOrderButtonDisabled(book)) {
      if (this.hasReachedBookLimit() && !book.ordered) {
        this.showError('You have reached the maximum limit of 3 books. Please return some books before ordering new ones.');
      }
      return;
    }

    const user = this.dataService.getUserInfo();
    if (!user) {
      this.showError('Please log in to order books.');
      return;
    }

    if (user.accountStatus !== 'APPROVED') {
      this.showError(`Your account is ${user.accountStatus?.toLowerCase()}. Please wait for admin approval.`);
      return;
    }

    console.log('All checks passed, calling dataService.orderBook...');

    this.dataService.orderBook(book)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Order response:', res);
          
          if (res.message?.includes('success') || res.message?.includes('submitted')) {
          
            book.ordered = true;
            book.orderStatus = 'PENDING';
            book.orderedBy = user.id;
            book.orderDate = new Date().toISOString();
            
            
            this.loadUserOrders();
            
            this.showSuccess(
              res.message || 'Book ordered successfully! Waiting for admin approval.'
            );
          } else if (res.message) {
            this.showError(res.message);
          } else {
            this.showError('Unexpected response from server.');
          }
        },
        error: (err) => {
          console.error('Order subscription error:', err);
          
          let errorMessage = 'Failed to order book. Please try again.';
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 403) {
            errorMessage = 'Your account is not approved or is blocked. Please contact admin.';
          } else if (err.status === 401) {
            errorMessage = 'Please log in to order books.';
          } else if (err.status === 400) {
            errorMessage = err.error?.message || 'Book is not available for ordering.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

  returnBook(book: Book): void {
    const user = this.dataService.getUserInfo();
    if (!user) {
      this.showError('Please log in to return books.');
      return;
    }

    const order = this.userOrders.find(o => 
      o.bookId === book.id && 
      o.userId === user.id && 
      o.status === 'APPROVED' &&
      !o.returned
    );

    if (!order) {
      this.showError('No active approved order found for this book.');
      return;
    }

    const fineAmount = this.dataService.getFine(order);

    if (fineAmount > 0) {
      const confirmMessage = `This book has a fine of Kshs ${fineAmount}. Has the fine been paid?`;
      if (!confirm(confirmMessage)) {
        this.showInfo('Please ensure the fine is paid before returning the book.');
        return;
      }
    }

    this.dataService.returnBookByOrderId(order.id, fineAmount > 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Return response:', res);
          
          if (res.message?.includes('successfully')) {
            book.ordered = false;
            book.orderStatus = undefined;
            book.orderedBy = undefined;
            book.orderDate = undefined;
            book.returnDate = undefined;
            
            this.loadUserOrders();
            
            const successMessage = fineAmount > 0 
              ? `Book returned successfully! Fine of Kshs ${fineAmount} processed.`
              : 'Book returned successfully!';
              
            this.showSuccess(successMessage);
          } else {
            this.showError(res.message || 'Failed to return book.');
          }
        },
        error: (err) => {
          console.error('Return error:', err);
          this.showError(err.error?.message || 'Failed to return book. Please try again.');
        }
      });
  }

  isOrderButtonDisabled(book: Book): boolean {
    const user = this.dataService.getUserInfo();
    
    if (!user) return true;
    
    
    if (!book.ordered && this.hasReachedBookLimit()) {
      return true;
    }

   
    if (book.orderedBy === user.id && book.orderStatus === 'APPROVED') {
      return false;
    }
    
   
    if (book.ordered) {
      return true;
    }
    
   
    if (user.accountStatus !== 'APPROVED') {
      return true;
    }
    
    return false;
  }

  getOrderButtonText(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (!user) return 'Order';
    
    if (book.orderedBy === user.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'Pending';
        case 'APPROVED':
          return 'Return';
        case 'RETURNED':
          return 'Order';
        case 'OVERDUE':
          return 'Overdue';
        case 'REJECTED':
          return 'Rejected';
        case 'UNAVAILABLE':
          return 'Not Available';
        default:
          return 'Order';
      }
    }
    
    if (book.ordered && book.orderedBy !== user.id) {
      return 'Not Available';
    }
    
    return 'Order';
  }

  getOrderButtonTooltip(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (!user) {
      return 'Please log in to order books';
    }

    
    if (this.hasReachedBookLimit() && !book.ordered) {
      return 'You have reached the maximum limit of 3 books. Return some books to order new ones.';
    }
    
    if (book.orderedBy === user.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'Waiting for admin approval';
        case 'APPROVED':
          return 'Click to return this book';
        case 'RETURNED':
          return 'Book returned. You can order again';
        case 'OVERDUE':
          return 'Book is overdue. Please contact admin';
        case 'REJECTED':
          return 'Your order was rejected by admin';
        case 'UNAVAILABLE':
          return 'This book is not available';
        default:
          return 'Order this book';
      }
    }
    
    if (book.ordered && book.orderedBy !== user.id) {
      return 'This book is currently borrowed by another user';
    }
    
    if (user.accountStatus !== 'APPROVED') {
      return `Your account is ${user.accountStatus?.toLowerCase()}. Please wait for admin approval.`;
    }
    
    return 'Order this book';
  }

  getStatusBadgeText(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (!book.ordered) {
      return 'Available';
    }
    
    if (book.orderedBy === user?.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'Pending Approval';
        case 'APPROVED':
          return 'Approved - In Use';
        case 'RETURNED':
          return 'Returned';
        case 'OVERDUE':
          return 'Overdue';
        case 'REJECTED':
          return 'Rejected';
        case 'UNAVAILABLE':
          return 'Not Available';
        default:
          return 'Ordered';
      }
    } else {
      return 'Not Available';
    }
  }

  getStatusBadgeClass(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (!book.ordered) {
      return 'available';
    }
    
    if (book.orderedBy === user?.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'pending';
        case 'APPROVED':
          return 'approved';
        case 'RETURNED':
          return 'returned';
        case 'OVERDUE':
          return 'overdue';
        case 'REJECTED':
          return 'unavailable';
        case 'UNAVAILABLE':
          return 'unavailable';
        default:
          return 'unavailable';
      }
    } else {
      return 'unavailable';
    }
  }

  getOrderButtonColor(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (book.orderedBy === user?.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'accent';
        case 'APPROVED':
          return 'primary';
        case 'OVERDUE':
          return 'warn';
        case 'REJECTED':
          return 'warn';
        default:
          return 'accent';
      }
    }
    
    return 'accent';
  }

  getOrderButtonIcon(book: Book): string {
    const user = this.dataService.getUserInfo();
    
    if (book.orderedBy === user?.id) {
      switch (book.orderStatus) {
        case 'PENDING':
          return 'schedule';
        case 'APPROVED':
          return 'assignment_return';
        case 'OVERDUE':
          return 'warning';
        case 'REJECTED':
          return 'cancel';
        default:
          return 'shopping_cart';
      }
    }
    
    return 'shopping_cart';
  }

  onButtonClick(book: Book): void {
    const user = this.dataService.getUserInfo();
    
    if (book.orderedBy === user?.id) {
      if (book.orderStatus === 'APPROVED') {
        this.returnBook(book);
      }
    } else {
      this.orderBook(book);
    }
  }
}